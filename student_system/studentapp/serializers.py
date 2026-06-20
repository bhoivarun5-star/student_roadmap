from rest_framework import serializers
from .models import Student, Skill, Assessment, Question, Choice, UserAttempt, UserAnswer


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Skill
        fields = ['id', 'name', 'proficiency', 'years_of_experience']


class StudentSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model  = Student
        fields = ['id', 'name', 'email', 'department', 'roll_number', 'skills']


# ─── Assessment Serializers ───────────────────────────────────────────────────

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Choice
        fields = ['id', 'text', 'order']
        # Note: is_correct is intentionally excluded from the public serializer
        # so students cannot see answers upfront


class ChoiceWithAnswerSerializer(serializers.ModelSerializer):
    """Used when returning results — includes is_correct."""
    class Meta:
        model  = Choice
        fields = ['id', 'text', 'is_correct', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ['id', 'text', 'question_type', 'marks', 'order', 'choices']


class QuestionWithAnswerSerializer(serializers.ModelSerializer):
    choices = ChoiceWithAnswerSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ['id', 'text', 'question_type', 'marks', 'order', 'explanation', 'choices']


class AssessmentListSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model  = Assessment
        fields = ['id', 'title', 'description', 'category', 'difficulty',
                  'duration_minutes', 'question_count', 'is_active']

    def get_question_count(self, obj):
        return obj.questions.count()


class AssessmentDetailSerializer(serializers.ModelSerializer):
    questions      = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model  = Assessment
        fields = ['id', 'title', 'description', 'category', 'difficulty',
                  'duration_minutes', 'question_count', 'questions']

    def get_question_count(self, obj):
        return obj.questions.count()


class AssessmentDetailWithAnswerSerializer(serializers.ModelSerializer):
    questions      = QuestionWithAnswerSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model  = Assessment
        fields = ['id', 'title', 'description', 'category', 'difficulty',
                  'duration_minutes', 'question_count', 'questions']

    def get_question_count(self, obj):
        return obj.questions.count()


class UserAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserAnswer
        fields = ['question', 'selected_choice', 'text_answer']


class SubmitAttemptSerializer(serializers.Serializer):
    supabase_user_id = serializers.CharField()
    assessment_id    = serializers.IntegerField()
    answers          = UserAnswerSerializer(many=True)


class UserAttemptSerializer(serializers.ModelSerializer):
    assessment_title    = serializers.CharField(source='assessment.title', read_only=True)
    assessment_category = serializers.CharField(source='assessment.category', read_only=True)

    class Meta:
        model  = UserAttempt
        fields = ['id', 'assessment', 'assessment_title', 'assessment_category',
                  'score', 'total_marks', 'percentage', 'completed', 'started_at', 'completed_at']
