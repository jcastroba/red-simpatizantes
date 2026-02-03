from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SympathizerViewSet, LocationViewSet, HealthCheckView
from .auth_views import (
    CheckUserView, RequestPasswordSetupView, SetPasswordView,
    LoginView, DashboardView, NetworkView, ForgotPasswordView, LevelLabelView,
    ImportTemplateView, ImportReferralsView
)
from .admin_views import (
    AdminLoginView, AdminNetworkListView, AdminUserListView,
    AdminUserDetailView, AdminToggleLinkView, AdminToggleSuspensionView,
    AdminExportUsersView, AdminNetworkVisualizationView
)

router = DefaultRouter()
router.register(r'sympathizers', SympathizerViewSet)
router.register(r'locations', LocationViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Health check
    path('health/', HealthCheckView.as_view(), name='health-check'),

    # Auth Routes
    path('auth/check-user/', CheckUserView.as_view()),
    path('auth/request-password/', RequestPasswordSetupView.as_view()),
    path('auth/forgot-password/', ForgotPasswordView.as_view()),
    path('auth/set-password/', SetPasswordView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/dashboard/', DashboardView.as_view()),
    path('auth/network/', NetworkView.as_view()),
    path('auth/level-labels/', LevelLabelView.as_view()),
    path('auth/import/template/', ImportTemplateView.as_view()),
    path('auth/import/', ImportReferralsView.as_view()),

    # Admin Routes
    path('admin/login/', AdminLoginView.as_view()),
    path('admin/networks/', AdminNetworkListView.as_view()),
    path('admin/users/', AdminUserListView.as_view()),
    path('admin/users/export/', AdminExportUsersView.as_view()),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view()),
    path('admin/users/<int:pk>/toggle-link/', AdminToggleLinkView.as_view()),
    path('admin/users/<int:pk>/toggle-suspension/', AdminToggleSuspensionView.as_view()),
    path('admin/networks/<int:pk>/visualization/', AdminNetworkVisualizationView.as_view()),
]
