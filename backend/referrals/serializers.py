from rest_framework import serializers
from .models import Sympathizer, Department, Municipality

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class MunicipalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Municipality
        fields = ['id', 'name', 'department']

class SympathizerSerializer(serializers.ModelSerializer):
    referrer_code = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department')
    municipio_id = serializers.PrimaryKeyRelatedField(queryset=Municipality.objects.all(), source='municipio')
    department_name = serializers.CharField(source='department.name', read_only=True)
    municipio_name = serializers.CharField(source='municipio.name', read_only=True)
    referrer_name = serializers.CharField(source='referrer.__str__', read_only=True)
    is_active = serializers.SerializerMethodField()
    has_account = serializers.SerializerMethodField()

    class Meta:
        model = Sympathizer
        fields = [
            'id', 'nombres', 'apellidos', 'cedula', 'email', 'phone', 'sexo',
            'department_id', 'municipio_id', 'department_name', 'municipio_name',
            'referral_code', 'referrer', 'referrer_name', 'created_at', 'activated_at', 'referrer_code',
            'link_enabled', 'is_active', 'has_account'
        ]
        read_only_fields = ['referral_code', 'created_at', 'activated_at', 'referrer', 'department_name', 'municipio_name', 'referrer_name']

    def get_is_active(self, obj):
        return obj.user.is_active if obj.user else False

    def get_has_account(self, obj):
        return obj.user is not None

    def create(self, validated_data):
        referrer_code = validated_data.pop('referrer_code', None)
        referrer = None
        if referrer_code:
            try:
                referrer = Sympathizer.objects.get(referral_code=referrer_code)
            except Sympathizer.DoesNotExist:
                pass 
        
        sympathizer = Sympathizer.objects.create(referrer=referrer, **validated_data)
        return sympathizer

    def update(self, instance, validated_data):
        # Handle updates if needed, specifically for the verification flow
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
