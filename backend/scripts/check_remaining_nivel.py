from referrals.models import Sympathizer
from django.db.models import Q
qs = Sympathizer.objects.filter(Q(nombres__icontains='Nivel') & Q(apellidos__icontains='Usuario') & Q(user__isnull=False))
print('Remaining with user:', qs.count())
for s in qs:
    print('Sym:', s.id, s.cedula, repr(s.nombres), repr(s.apellidos), 'user_id=', s.user_id)
