from rest_framework import serializers
from exiled_game.models import Score

class ScoreSerializer(serializers.ModelSerializer):

    class Meta:
        model = Score
        fields = ['score']
