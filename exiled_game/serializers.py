from rest_framework import serializers
from exiled_game.models import Score

class ScoreSerializer(serializers.ModelSerializer):

    index_of_score = serializers.SerializerMethodField()

    class Meta:
        model = Score
        fields = ['score', 'name', 'kills', 'game_round', 'index_of_score']

    def get_index_of_score(self, obj):
        i = 1
        scores = Score.objects.all()
        for score in scores:
            if score == obj:
                return i
            i += 1
        return 100
