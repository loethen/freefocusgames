'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ArrowRight, Info } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { analytics } from '@/lib/analytics';

// Vanderbilt ADHD Rating Scale questions
const ADHD_QUESTIONS = [
  // Inattention symptoms (1-9)
  { id: 1, category: 'inattention', key: 'question1' },
  { id: 2, category: 'inattention', key: 'question2' },
  { id: 3, category: 'inattention', key: 'question3' },
  { id: 4, category: 'inattention', key: 'question4' },
  { id: 5, category: 'inattention', key: 'question5' },
  { id: 6, category: 'inattention', key: 'question6' },
  { id: 7, category: 'inattention', key: 'question7' },
  { id: 8, category: 'inattention', key: 'question8' },
  { id: 9, category: 'inattention', key: 'question9' },
  // Hyperactivity/Impulsivity symptoms (10-18)
  { id: 10, category: 'hyperactivity', key: 'question10' },
  { id: 11, category: 'hyperactivity', key: 'question11' },
  { id: 12, category: 'hyperactivity', key: 'question12' },
  { id: 13, category: 'hyperactivity', key: 'question13' },
  { id: 14, category: 'hyperactivity', key: 'question14' },
  { id: 15, category: 'hyperactivity', key: 'question15' },
  { id: 16, category: 'hyperactivity', key: 'question16' },
  { id: 17, category: 'hyperactivity', key: 'question17' },
  { id: 18, category: 'hyperactivity', key: 'question18' },
];

interface AdhdAnswers {
  [key: number]: number; // 0=Never, 1=Occasionally, 2=Often, 3=Very Often
}

interface AssessmentInfo {
  subject: string;
  age: string;
}

type Step = 'intro' | 'info' | 'questionnaire' | 'results';

export default function AdhdAssessmentFlow() {
  const t = useTranslations('adhdAssessment');
  const tQuestions = useTranslations('adhdAssessment.questions');
  const tResults = useTranslations('adhdAssessment.results');

  const [step, setStep] = useState<Step>('intro');
  const [assessmentInfo, setAssessmentInfo] = useState<AssessmentInfo>({
    subject: '',
    age: ''
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AdhdAnswers>({});

  const currentQuestion = ADHD_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === ADHD_QUESTIONS.length - 1;

  // Calculate scores and get recommendations
  const getRecommendedGames = useCallback((finalAnswers: AdhdAnswers) => {
    const inattentionScore = ADHD_QUESTIONS
      .filter(q => q.category === 'inattention')
      .reduce((sum, q) => sum + (finalAnswers[q.id] || 0), 0);

    const hyperactivityScore = ADHD_QUESTIONS
      .filter(q => q.category === 'hyperactivity')
      .reduce((sum, q) => sum + (finalAnswers[q.id] || 0), 0);

    const recommendations = [];

    // Recommend games based on scores
    if (inattentionScore >= 12) { // High inattention
      recommendations.push('dual-n-back', 'stroop-effect-test');
    } else if (inattentionScore >= 8) {
      recommendations.push('schulte-table', 'larger-number');
    }

    if (hyperactivityScore >= 12) { // High hyperactivity/impulsivity
      recommendations.push('reaction-time', 'stroop-effect-test');
    }

    return recommendations.length > 0 ? recommendations : ['dual-n-back'];
  }, []);

  // Start assessment
  const handleStartAssessment = useCallback(() => {
    analytics.assessment.start({
      test_type: 'adhd_assessment',
    });
    setStep('info');
  }, []);

  // Handle info form submission
  const handleInfoSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (assessmentInfo.subject && assessmentInfo.age) {
      setStep('questionnaire');
    }
  }, [assessmentInfo]);

  // Handle answer selection
  const handleAnswer = useCallback((score: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      // Complete assessment and go to results
      analytics.assessment.complete({
        test_type: 'adhd_assessment',
        recommendations: getRecommendedGames(newAnswers)
      });
      setStep('results');
    } else {
      // Go to next question
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [answers, currentQuestion, isLastQuestion, getRecommendedGames]);


  const calculateResults = useCallback(() => {
    const inattentionQuestions = ADHD_QUESTIONS.filter(q => q.category === 'inattention');
    const hyperactivityQuestions = ADHD_QUESTIONS.filter(q => q.category === 'hyperactivity');

    const inattentionScore = inattentionQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
    const hyperactivityScore = hyperactivityQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);

    // Count symptoms rated 2 (Often) or 3 (Very Often) - clinical significance
    const inattentionSymptoms = inattentionQuestions.filter(q => (answers[q.id] || 0) >= 2).length;
    const hyperactivitySymptoms = hyperactivityQuestions.filter(q => (answers[q.id] || 0) >= 2).length;

    return {
      inattentionScore,
      hyperactivityScore,
      inattentionSymptoms,
      hyperactivitySymptoms,
      totalSymptoms: inattentionSymptoms + hyperactivitySymptoms
    };
  }, [answers]);

  const getResultsInterpretation = useCallback(() => {
    const results = calculateResults();

    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    let recommendations: string[] = [];

    // Clinical criteria: 6 or more symptoms in either category
    if (results.inattentionSymptoms >= 6 || results.hyperactivitySymptoms >= 6) {
      riskLevel = 'high';
      recommendations = ['dual-n-back', 'stroop-effect-test'];
    } else if (results.totalSymptoms >= 8) {
      riskLevel = 'moderate';
      recommendations = ['schulte-table', 'larger-number'];
    } else {
      riskLevel = 'low';
      recommendations = ['reaction-time', 'schulte-table'];
    }

    return { ...results, riskLevel, recommendations };
  }, [calculateResults]);

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = ['intro', 'info', 'questionnaire', 'results'];
    const currentStepIndex = steps.indexOf(step);

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${index < currentStepIndex
                ? "bg-green-600 text-white"
                : index === currentStepIndex
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-500"
                }`}
            >
              {index < currentStepIndex ? (
                <Check size={16} />
              ) : index === currentStepIndex ? (
                <div className="w-3 h-3 bg-white rounded-full" />
              ) : (
                <div className="w-3 h-3 bg-gray-400 rounded-full" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 transition-all ${index < currentStepIndex ? "bg-green-600" : "bg-gray-300"
                  }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render intro step
  const renderIntro = () => (
    <div className="space-y-6 text-center max-w-3xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {t('subtitle')}
        </p>
      </div>


      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          {t('aboutScale.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('aboutScale.content')}
        </p>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <Info size={16} className="text-blue-500 flex-shrink-0" />
            {t('features.professional')}
          </li>
          <li className="flex items-center gap-2">
            <Info size={16} className="text-blue-500 flex-shrink-0" />
            {t('features.comprehensive')}
          </li>
          <li className="flex items-center gap-2">
            <Info size={16} className="text-blue-500 flex-shrink-0" />
            {t('features.evidence')}
          </li>
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('learnMore.text')}
          </p>
          <div className="flex flex-col items-start gap-2">
            <Link
              href="/blog/scoring-the-vanderbilt-adhd-rating-scale"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {t('learnMore.scoringLinkText')}
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/blog/vanderbilt-adhd-rating-scale-comprehensive-guide"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {t('learnMore.linkText')}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <button
        onClick={handleStartAssessment}
        className="px-8 py-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-lg transition-colors shadow-lg"
      >
        {t('buttons.startAssessment')}
      </button>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('disclaimer.simple')}
        </p>
      </div>
    </div>
  );

  // Render info collection step
  const renderInfo = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('infoStep.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('infoStep.subtitle')}
        </p>
      </div>

      <form onSubmit={handleInfoSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('infoStep.subject')}
          </label>
          <input
            type="text"
            required
            value={assessmentInfo.subject}
            onChange={(e) => setAssessmentInfo(prev => ({ ...prev, subject: e.target.value }))}
            placeholder={t('infoStep.subjectPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('infoStep.age')}
          </label>
          <input
            type="text"
            required
            value={assessmentInfo.age}
            onChange={(e) => setAssessmentInfo(prev => ({ ...prev, age: e.target.value }))}
            placeholder={t('infoStep.agePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-lg transition-colors"
        >
          {t('buttons.continue')}
        </button>
      </form>
    </div>
  );

  // Render questionnaire step
  const renderQuestionnaire = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('questionnaire.title')}
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {currentQuestionIndex + 1} / {ADHD_QUESTIONS.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / ADHD_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <p className="text-lg text-gray-900 dark:text-white mb-6">
          {tQuestions(currentQuestion.key)}
        </p>

        <div className="space-y-3">
          {[
            { value: 0, label: t('scale.never') },
            { value: 1, label: t('scale.occasionally') },
            { value: 2, label: t('scale.often') },
            { value: 3, label: t('scale.veryOften') }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white group-hover:text-green-800 dark:group-hover:text-green-200">
                  {option.label}
                </span>
                <span className="text-sm text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400">
                  {option.value}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Render results step
  const renderResults = () => {
    const results = getResultsInterpretation();

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {tResults('title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {tResults('subtitle')}
          </p>
        </div>

        {/* Assessment Summary */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {tResults('assessmentSummary')}
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">{tResults('subject')}:</span> {assessmentInfo.subject}</p>
            <p><span className="font-medium">{tResults('age')}:</span> {assessmentInfo.age}</p>
            <p><span className="font-medium">{tResults('totalQuestions')}:</span> {ADHD_QUESTIONS.length}</p>
          </div>
        </div>

        {/* Results Analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {tResults('inattentionResults')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tResults('symptomsCount')}:</span>
                <span className="font-semibold">{results.inattentionSymptoms} / 9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tResults('totalScore')}:</span>
                <span className="font-semibold">{results.inattentionScore}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {tResults('hyperactivityResults')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tResults('symptomsCount')}:</span>
                <span className="font-semibold">{results.hyperactivitySymptoms} / 9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tResults('totalScore')}:</span>
                <span className="font-semibold">{results.hyperactivityScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className={`border rounded-lg p-6 ${results.riskLevel === 'high'
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : results.riskLevel === 'moderate'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
          <h3 className="font-semibold mb-3">
            {tResults(`riskLevels.${results.riskLevel}.title`)}
          </h3>
          <p className="text-sm mb-4">
            {tResults(`riskLevels.${results.riskLevel}.description`)}
          </p>
          {results.riskLevel !== 'low' && (
            <p className="text-sm font-medium">
              {tResults('recommendation')}
            </p>
          )}
        </div>

        {/* Game Recommendations */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {tResults('gameRecommendations')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {tResults('gameRecommendationsSubtitle')}
          </p>
          <div className="space-y-3">
            {results.recommendations.map((gameSlug) => (
              <Link key={gameSlug} href={`/games/${gameSlug}`}>
                <button
                  className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
                  onClick={() => {
                    analytics.navigation.recommendation({
                      from_page: 'adhd-assessment',
                      to_page: `games/${gameSlug}`,
                      source: 'adhd_assessment_recommendation',
                      game_to: gameSlug
                    });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white group-hover:text-green-800 dark:group-hover:text-green-200">
                      {tResults(`gameNames.${gameSlug}`)}
                    </span>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400">
                    {tResults(`gameDescriptions.${gameSlug}`)}
                  </p>
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              setStep('intro');
              setCurrentQuestionIndex(0);
              setAnswers({});
              setAssessmentInfo({ subject: '', age: '' });
            }}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {tResults('retakeAssessment')}
          </button>
          <Link href="/games">
            <button className="px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-lg transition-colors">
              {tResults('exploreAllGames')}
            </button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {renderStepIndicator()}

        <div className="mt-8">
          {step === 'intro' && renderIntro()}
          {step === 'info' && renderInfo()}
          {step === 'questionnaire' && renderQuestionnaire()}
          {step === 'results' && renderResults()}
        </div>
      </div>
    </div>
  );
}
