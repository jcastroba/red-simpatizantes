from django.contrib.auth.models import User
from django.db.models import Q

# Match either: first_name Nivel<digits> and last_name Usuario<digits>
# or single-field "Nivel<digits> Usuario<digits>" in first_name,
# or broader contains checks for safety.
cond1 = Q(first_name__regex=r'^\s*Nivel[0-9]+') & Q(last_name__regex=r'^\s*Usuario[0-9]+')
cond2 = Q(first_name__regex=r'^\s*Nivel[0-9]+\s+Usuario[0-9]+')
cond3 = Q(first_name__icontains='Nivel') & Q(last_name__icontains='Usuario')
qs = User.objects.filter(cond1 | cond2 | cond3)

print('Found', qs.count(), 'users')
for u in qs:
    print(u.id, u.username, repr(u.first_name), repr(u.last_name))

ids = list(qs.values_list('id', flat=True))
if ids:
    qs.delete()
    print('Deleted IDs:', ids)
else:
    print('No users to delete')
