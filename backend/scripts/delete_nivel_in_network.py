import csv
from referrals.models import Sympathizer
from django.contrib.auth.models import User

root_cedula = '98657941'
backup_path = 'scripts/backup_deleted_users_98657941.csv'

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

# Filter matches
matches = [s for s in descendants if s.nombres and s.apellidos and 'Nivel' in s.nombres and 'Usuario' in s.apellidos]

print('Root:', root.id, root.cedula, root.nombres, root.apellidos)
print('Total descendants:', len(descendants))
print('Matches to process:', len(matches))

if matches:
    with open(backup_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['sym_id','cedula','nombres','apellidos','user_id','deleted_user_id','note'])
        deleted_ids = []
        for s in matches:
            uid = s.user_id
            row = [s.id, s.cedula, s.nombres, s.apellidos, uid, '', '']
            if uid:
                # detach first to avoid cascade
                s.user = None
                s.save()
                try:
                    User.objects.filter(id=uid).delete()
                    row[5] = uid
                    row[6] = 'deleted'
                    deleted_ids.append(uid)
                    print('Deleted user', uid, 'for sympathizer', s.id)
                except Exception as e:
                    row[6] = f'error:{e}'
                    print('Error deleting user', uid, e)
            else:
                row[6] = 'no_user'
            writer.writerow(row)
    print('Backup written to', backup_path)
    print('Total deleted users:', len(deleted_ids))
else:
    print('No matches to process')
