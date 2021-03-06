from django.shortcuts import render, redirect
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from exiled_game.models import Score
from exiled_game.serializers import ScoreSerializer
# Create your views here.
def index(request):
    return render(request, 'index.html')

def showCredits(request):
    return render(request, 'credits.html')

def showControls(request):
    return render(request, 'controls.html')

# API views
class AllScores(generics.ListCreateAPIView):
    queryset = Score.objects.all()
    serializer_class = ScoreSerializer
