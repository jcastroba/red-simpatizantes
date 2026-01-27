from referrals.models import Sympathizer
from django.db.models import Q

root_cedula = '98657941'
try:
    root = Sympathizer.objects.get(cedula=root_cedula)
except Sympathizer.DoesNotExist:
    print('Root sympathizer not found for cedula', root_cedula)
    raise SystemExit(1)

# BFS to collect all descendants
to_visit = list(root.referrals.all())
descendants = []
while to_visit:
    cur = to_visit.pop(0)
    descendants.append(cur)
    to_visit.extend(list(cur.referrals.all()))

# Filter those matching patterns
cond1 = Q(nombres__regex=r'^\s*Nivel[0-9]+') & Q(apellidos__regex=r'^\s*Usuario[0-9]+')
cond2 = Q(nombres__regex=r'^\s*Nivel[0-9]+\s+Usuario[0-9]+')
cond3 = Q(nombres__icontains='Nivel') & Q(apellidos__icontains='Usuario')

matched = [s for s in descendants if (cond1.evaluate(s) if hasattr(cond1, 'evaluate') else (s.nombres and s.apellidos and (s.nombres.strip().startswith('Nivel') and s.apellidos.strip().startswith('Usuario'))))]

# Fallback broader contains check (in case regex Q evaluation not available in plain object)
if not matched:
    matched = [s for s in descendants if ('Nivel' in (s.nombres or '') and 'Usuario' in (s.apellidos or ''))]

print('Root:', root.id, root.cedula, root.nombres, root.apellidos)
print('Total descendants:', len(descendants))
print('Matches found:', len(matched))
for s in matched:
    print(s.id, s.cedula, repr(s.nombres), repr(s.apellidos), 'user_id=', s.user_id)
