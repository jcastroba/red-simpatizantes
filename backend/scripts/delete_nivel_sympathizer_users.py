from referrals.models import Sympathizer
from django.contrib.auth.models import User
from django.db.models import Q

# Find Sympathizers matching patterns in nombres/apellidos
cond1 = Q(nombres__regex=r'^\s*Nivel[0-9]+') & Q(apellidos__regex=r'^\s*Usuario[0-9]+')
cond2 = Q(nombres__regex=r'^\s*Nivel[0-9]+\s+Usuario[0-9]+')
cond3 = Q(nombres__icontains='Nivel') & Q(apellidos__icontains='Usuario')
qs = Sympathizer.objects.filter(cond1 | cond2 | cond3)

print('Found', qs.count(), 'sympathizers')
deleted_user_ids = []
for s in qs:
    print('Sym:', s.id, s.cedula, repr(s.nombres), repr(s.apellidos), 'user_id=', s.user_id)
    if s.user_id:
        uid = s.user_id
        # detach user to avoid cascade-deleting the Sympathizer
        s.user = None
        s.save()
        try:
            User.objects.filter(id=uid).delete()
            deleted_user_ids.append(uid)
            print('Deleted user', uid)
        except Exception as e:
            print('Error deleting user', uid, e)

if deleted_user_ids:
    print('Deleted user IDs:', deleted_user_ids)
else:
    print('No users deleted')
