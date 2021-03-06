from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Player (models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    scores = models.ForeignKey('Score', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f'{self.user.username}'


class Score (models.Model):
    score = models.IntegerField()
    game_round = models.IntegerField(null=True, blank=True)
    kills = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=11, null=True, blank=True)

    class Meta:
        ordering = ['-score']
