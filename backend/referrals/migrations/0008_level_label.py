from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('referrals', '0007_add_network_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='LevelLabel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('level', models.PositiveIntegerField()),
                ('name', models.CharField(max_length=100)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='level_labels', to='referrals.sympathizer')),
            ],
            options={
                'verbose_name': 'Nombre de Nivel',
                'verbose_name_plural': 'Nombres de Niveles',
                'ordering': ['level'],
                'unique_together': {('owner', 'level')},
            },
        ),
    ]
