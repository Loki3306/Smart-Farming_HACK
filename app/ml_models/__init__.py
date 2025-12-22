"""
Machine Learning Models Module
Contains trained models for smart farming decisions
"""

from .fertilizer_recommender import FertilizerRecommender, get_fertilizer_recommender

__all__ = ['FertilizerRecommender', 'get_fertilizer_recommender']
