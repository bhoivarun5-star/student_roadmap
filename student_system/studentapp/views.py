import json
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Student, Skill,
    Assessment, Question, Choice,
    UserAttempt, UserAnswer,
)
from .serializers import (
    StudentSerializer,
    AssessmentListSerializer,
    AssessmentDetailSerializer,
    QuestionWithAnswerSerializer,
    UserAttemptSerializer,
    AssessmentDetailWithAnswerSerializer,
)


# ─── Student Views ────────────────────────────────────────────────────────────

@api_view(['GET'])
def student_list(request):
    students = Student.objects.prefetch_related('skills').all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def student_detail(request, pk=None):
    if request.method == 'POST':
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = Student.objects.prefetch_related('skills').get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    return Response(StudentSerializer(student).data)


# ─── Assessment Views ─────────────────────────────────────────────────────────

@api_view(['GET'])
def assessment_list(request):
    """
    GET /api/assessments/
    Optional query param: ?category=aptitude&all=true
    Returns only active assessments, unless all=true is passed.
    """
    show_all = request.GET.get('all') == 'true'
    if show_all:
        qs = Assessment.objects.all()
    else:
        qs = Assessment.objects.filter(is_active=True)
        
    category = request.GET.get('category')
    if category:
        qs = qs.filter(category=category)
    serializer = AssessmentListSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
def delete_assessment(request, pk):
    """
    DELETE /api/assessments/<pk>/delete/
    Deletes the assessment.
    """
    try:
        assessment = Assessment.objects.get(pk=pk)
        assessment.delete()
        return Response({'message': 'Assessment deleted successfully!'}, status=status.HTTP_200_OK)
    except Assessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def global_attempts(request):
    """
    GET /api/assessments/global-scores/
    Returns all attempts made by all students.
    """
    attempts = UserAttempt.objects.filter(completed=True).select_related('assessment').order_by('-completed_at')
    serializer = UserAttemptSerializer(attempts, many=True)
    return Response(serializer.data)



@api_view(['GET'])
def assessment_detail(request, pk):
    """
    GET /api/assessments/<pk>/
    Returns full assessment with questions and choices (no correct answers).
    """
    try:
        assessment = Assessment.objects.prefetch_related(
            'questions__choices'
        ).get(pk=pk, is_active=True)
    except Assessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=404)
    serializer = AssessmentDetailSerializer(assessment)
    return Response(serializer.data)


@api_view(['POST'])
def submit_attempt(request):
    """
    POST /api/assessments/submit/
    Body: {
      "supabase_user_id": "...",
      "assessment_id": 1,
      "answers": [
        {"question_id": 1, "choice_id": 3},
        ...
      ]
    }
    Returns: score, percentage, per-question results
    """
    data = request.data
    supabase_user_id = data.get('supabase_user_id')
    assessment_id    = data.get('assessment_id')
    answers_data     = data.get('answers', [])

    if not supabase_user_id or not assessment_id:
        return Response({'error': 'supabase_user_id and assessment_id are required'}, status=400)

    try:
        assessment = Assessment.objects.prefetch_related('questions__choices').get(pk=assessment_id)
    except Assessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=404)

    # Create attempt record
    attempt = UserAttempt.objects.create(
        supabase_user_id=supabase_user_id,
        assessment=assessment,
    )

    total_marks = 0
    earned_marks = 0
    results = []

    for ans in answers_data:
        question_id = ans.get('question_id')
        choice_id   = ans.get('choice_id')
        text_answer = ans.get('text_answer', '')

        try:
            question = assessment.questions.get(pk=question_id)
        except Question.DoesNotExist:
            continue

        total_marks += question.marks
        selected_choice = None
        is_correct = None

        if choice_id:
            try:
                selected_choice = question.choices.get(pk=choice_id)
                is_correct = selected_choice.is_correct
                if is_correct:
                    earned_marks += question.marks
            except Choice.DoesNotExist:
                pass

        # For text answers, mark as None (manual grading) unless it's personality
        if question.question_type == 'text':
            is_correct = None

        UserAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_choice=selected_choice,
            text_answer=text_answer,
            is_correct=is_correct,
        )

        # Build result with correct answer info
        correct_choice = question.choices.filter(is_correct=True).first()
        results.append({
            'question_id':      question.id,
            'question_text':    question.text,
            'your_choice_id':   choice_id,
            'your_choice_text': selected_choice.text if selected_choice else text_answer,
            'correct_choice_id':   correct_choice.id if correct_choice else None,
            'correct_choice_text': correct_choice.text if correct_choice else None,
            'is_correct':       is_correct,
            'marks':            question.marks,
            'explanation':      question.explanation,
        })

    percentage = round((earned_marks / total_marks * 100), 1) if total_marks else 0

    attempt.score        = earned_marks
    attempt.total_marks  = total_marks
    attempt.percentage   = percentage
    attempt.completed    = True
    attempt.completed_at = timezone.now()
    attempt.save()

    return Response({
        'attempt_id':   attempt.id,
        'score':        earned_marks,
        'total_marks':  total_marks,
        'percentage':   percentage,
        'results':      results,
    })


@api_view(['GET'])
def user_scores(request, supabase_user_id):
    """
    GET /api/assessments/scores/<supabase_user_id>/
    Returns all completed attempts for a user.
    """
    attempts = UserAttempt.objects.filter(
        supabase_user_id=supabase_user_id,
        completed=True
    ).select_related('assessment')
    serializer = UserAttemptSerializer(attempts, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def create_assessment(request):
    """
    POST /api/assessments/create/
    Body: {
      "title": "...",
      "description": "...",
      "category": "aptitude" | "technical" | "communication" | "personality",
      "difficulty": "easy" | "medium" | "hard",
      "duration_minutes": 30,
      "questions": [
        {
          "text": "...",
          "question_type": "mcq",
          "marks": 2,
          "order": 1,
          "explanation": "...",
          "choices": [
            {"text": "Option A", "is_correct": true},
            {"text": "Option B", "is_correct": false}
          ]
        }
      ]
    }
    """
    data = request.data
    title = data.get('title')
    category = data.get('category')

    if not title or not category:
        return Response({'error': 'Title and category are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        assessment = Assessment.objects.create(
            title=title,
            description=data.get('description', ''),
            category=category,
            difficulty=data.get('difficulty', 'medium'),
            duration_minutes=int(data.get('duration_minutes', 30)),
            is_active=True
        )

        questions_data = data.get('questions', [])
        for q_idx, q_data in enumerate(questions_data):
            question = Question.objects.create(
                assessment=assessment,
                text=q_data.get('text', ''),
                question_type=q_data.get('question_type', 'mcq'),
                marks=int(q_data.get('marks', 1)),
                order=int(q_data.get('order', q_idx + 1)),
                explanation=q_data.get('explanation', '')
            )

            choices_data = q_data.get('choices', [])
            for c_idx, c_data in enumerate(choices_data):
                Choice.objects.create(
                    question=question,
                    text=c_data.get('text', ''),
                    is_correct=bool(c_data.get('is_correct', False)),
                    order=int(c_data.get('order', c_idx))
                )

        return Response({
            'message': 'Assessment created successfully!',
            'id': assessment.id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def assessment_detail_with_answers(request, pk):
    """
    GET /api/assessments/<pk>/with-answers/
    Returns full assessment with questions, choices, explanations and correct answers.
    Used for editing assessments.
    """
    try:
        assessment = Assessment.objects.prefetch_related(
            'questions__choices'
        ).get(pk=pk)
    except Assessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=404)
    serializer = AssessmentDetailWithAnswerSerializer(assessment)
    return Response(serializer.data)


@api_view(['PUT'])
def update_assessment(request, pk):
    """
    PUT /api/assessments/<pk>/update/
    Body: same structure as create_assessment, but can optionally include "id" for questions and choices.
    """
    try:
        assessment = Assessment.objects.get(pk=pk)
    except Assessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=404)

    data = request.data
    title = data.get('title')
    category = data.get('category')

    if not title or not category:
        return Response({'error': 'Title and category are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        assessment.title = title
        assessment.description = data.get('description', '')
        assessment.category = category
        assessment.difficulty = data.get('difficulty', 'medium')
        assessment.duration_minutes = int(data.get('duration_minutes', 30))
        assessment.save()

        questions_data = data.get('questions', [])
        active_question_ids = []

        for q_idx, q_data in enumerate(questions_data):
            q_id = q_data.get('id')
            question_type = q_data.get('question_type', 'mcq')

            if q_id:
                try:
                    question = Question.objects.get(pk=q_id, assessment=assessment)
                    question.text = q_data.get('text', '')
                    question.question_type = question_type
                    question.marks = int(q_data.get('marks', 1))
                    question.order = int(q_data.get('order', q_idx + 1))
                    question.explanation = q_data.get('explanation', '')
                    question.save()
                except Question.DoesNotExist:
                    question = Question.objects.create(
                        assessment=assessment,
                        text=q_data.get('text', ''),
                        question_type=question_type,
                        marks=int(q_data.get('marks', 1)),
                        order=int(q_data.get('order', q_idx + 1)),
                        explanation=q_data.get('explanation', '')
                    )
            else:
                question = Question.objects.create(
                    assessment=assessment,
                    text=q_data.get('text', ''),
                    question_type=question_type,
                    marks=int(q_data.get('marks', 1)),
                    order=int(q_data.get('order', q_idx + 1)),
                    explanation=q_data.get('explanation', '')
                )

            active_question_ids.append(question.id)

            if question_type != 'text':
                choices_data = q_data.get('choices', [])
                active_choice_ids = []

                for c_idx, c_data in enumerate(choices_data):
                    c_id = c_data.get('id')
                    is_correct = bool(c_data.get('is_correct', False))
                    if category == 'personality':
                        is_correct = False

                    if c_id:
                        try:
                            choice = Choice.objects.get(pk=c_id, question=question)
                            choice.text = c_data.get('text', '')
                            choice.is_correct = is_correct
                            choice.order = int(c_data.get('order', c_idx))
                            choice.save()
                        except Choice.DoesNotExist:
                            choice = Choice.objects.create(
                                question=question,
                                text=c_data.get('text', ''),
                                is_correct=is_correct,
                                order=int(c_data.get('order', c_idx))
                            )
                    else:
                        choice = Choice.objects.create(
                            question=question,
                            text=c_data.get('text', ''),
                            is_correct=is_correct,
                            order=int(c_data.get('order', c_idx))
                        )

                    active_choice_ids.append(choice.id)

                Choice.objects.filter(question=question).exclude(id__in=active_choice_ids).delete()
            else:
                Choice.objects.filter(question=question).delete()

        Question.objects.filter(assessment=assessment).exclude(id__in=active_question_ids).delete()

        return Response({
            'message': 'Assessment updated successfully!',
            'id': assessment.id
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
