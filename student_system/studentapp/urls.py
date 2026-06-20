from django.urls import path
from . import views

urlpatterns = [
    # Student
    path('students/',         views.student_list,   name='student-list'),
    path('students/<int:pk>/',views.student_detail, name='student-detail'),

    # Assessments
    path('assessments/',                              views.assessment_list,   name='assessment-list'),
    path('assessments/create/',                       views.create_assessment, name='create-assessment'),
    path('assessments/global-scores/',                views.global_attempts,   name='global-attempts'),
    path('assessments/<int:pk>/',                     views.assessment_detail, name='assessment-detail'),
    path('assessments/<int:pk>/with-answers/',        views.assessment_detail_with_answers, name='assessment-detail-with-answers'),
    path('assessments/<int:pk>/update/',              views.update_assessment, name='update-assessment'),
    path('assessments/<int:pk>/delete/',              views.delete_assessment, name='delete-assessment'),
    path('assessments/submit/',                       views.submit_attempt,    name='submit-attempt'),
    path('assessments/scores/<str:supabase_user_id>/',views.user_scores,       name='user-scores'),
]
