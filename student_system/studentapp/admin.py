from django.contrib import admin
from .models import Student, Skill, Assessment, Question, Choice, UserAttempt, UserAnswer
# Added nested admin support
try:
    from nested_admin import NestedModelAdmin, NestedStackedInline, NestedTabularInline
except ImportError:
    # Fallback to regular admin if nested_admin is not installed
    NestedModelAdmin = admin.ModelAdmin
    NestedStackedInline = admin.StackedInline
    NestedTabularInline = admin.TabularInline


# ─── Student Admin ────────────────────────────────────────────────────────────
class SkillInline(admin.TabularInline):
    model = Skill
    extra = 1

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display  = ('name', 'email', 'department', 'roll_number')
    search_fields = ('name', 'email', 'roll_number')
    inlines       = [SkillInline]


# ─── Assessment Admin ─────────────────────────────────────────────────────────
class ChoiceInline(NestedTabularInline):
    model  = Choice
    extra  = 4
    fields = ('text', 'is_correct', 'order')


class QuestionInline(NestedStackedInline):
    model      = Question
    extra      = 1
    fields     = ('text', 'question_type', 'marks', 'order', 'explanation')
    show_change_link = True
    inlines = [ChoiceInline]


@admin.register(Assessment)
class AssessmentAdmin(NestedModelAdmin):
    list_display   = ('title', 'category', 'difficulty', 'duration_minutes', 'question_count', 'is_active', 'created_at')
    list_filter    = ('category', 'difficulty', 'is_active')
    search_fields  = ('title', 'description')
    list_editable  = ('is_active',)
    inlines        = [QuestionInline]

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Questions'


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display  = ('__str__', 'assessment', 'question_type', 'marks', 'order')
    list_filter   = ('assessment', 'question_type')
    search_fields = ('text',)
    inlines       = [ChoiceInline]


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display  = ('text', 'question', 'is_correct', 'order')
    list_filter   = ('is_correct',)


@admin.register(UserAttempt)
class UserAttemptAdmin(admin.ModelAdmin):
    list_display  = ('supabase_user_id', 'assessment', 'score', 'total_marks', 'percentage', 'completed', 'started_at')
    list_filter   = ('completed', 'assessment')
    search_fields = ('supabase_user_id',)
    readonly_fields = ('started_at', 'completed_at')


@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display  = ('attempt', 'question', 'selected_choice', 'is_correct')
    list_filter   = ('is_correct',)
