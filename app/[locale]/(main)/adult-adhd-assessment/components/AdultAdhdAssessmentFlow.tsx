'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import { analytics } from '@/lib/analytics';

// WHO Adult ADHD Self-Report Scale (ASRS-v1.1) questions
const ASRS_QUESTIONS = [
  // Part A (Screening questions 1-6)
  { id: 1, category: 'inattention', key: 'question1', partA: true },
  { id: 2, category: 'inattention', key: 'question2', partA: true },
  { id: 3, category: 'inattention', key: 'question3', partA: true },
  { id: 4, category: 'inattention', key: 'question4', partA: true },
  { id: 5, category: 'hyperactivity', key: 'question5', partA: true },
  { id: 6, category: 'hyperactivity', key: 'question6', partA: true },
  // Part B (Additional questions 7-18)
  { id: 7, category: 'inattention', key: 'question7', partA: false },
  { id: 8, category: 'inattention', key: 'question8', partA: false },
  { id: 9, category: 'inattention', key: 'question9', partA: false },
  { id: 10, category: 'inattention', key: 'question10', partA: false },
  { id: 11, category: 'inattention', key: 'question11', partA: false },
  { id: 12, category: 'hyperactivity', key: 'question12', partA: false },
  { id: 13, category: 'hyperactivity', key: 'question13', partA: false },
  { id: 14, category: 'hyperactivity', key: 'question14', partA: false },
  { id: 15, category: 'hyperactivity', key: 'question15', partA: false },
  { id: 16, category: 'hyperactivity', key: 'question16', partA: false },
  { id: 17, category: 'hyperactivity', key: 'question17', partA: false },
  { id: 18, category: 'hyperactivity', key: 'question18', partA: false },
];

interface AsrsAnswers {
  [key: number]: number; // 0=Never, 1=Rarely, 2=Sometimes, 3=Often, 4=Very Often
}

interface AssessmentInfo {
  subject: string;
  age: string;
}

type Step = 'intro' | 'info' | 'questionnaire' | 'results';

export default function AdultAdhdAssessmentFlow() {
  const t = useTranslations('adultAdhdAssessment');
  const tQuestions = useTranslations('adultAdhdAssessment.questions');
  const tResults = useTranslations('adultAdhdAssessment.results');

  const [step, setStep] = useState<Step>('intro');
  const [assessmentInfo, setAssessmentInfo] = useState<AssessmentInfo>({
    subject: '',
    age: '',
  });
  const [answers, setAnswers] = useState<AsrsAnswers>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const getRecommendedGames = useCallback((partAScore: number) => {
    const games = [];
    
    // High likelihood - comprehensive training
    if (partAScore >= 4) {
      games.push('dual-n-back', 'stroop-effect-test', 'schulte-table');
    }
    // Moderate likelihood - focused training
    else if (partAScore >= 2) {
      games.push('stroop-effect-test', 'schulte-table', 'reaction-time');
    }
    // Low likelihood - general enhancement
    else {
      games.push('schulte-table', 'larger-number', 'reaction-time');
    }

    return games.slice(0, 3);
  }, []);

  const handleStartAssessment = () => {
    analytics.assessment.start({
      test_type: 'adult_adhd_asrs'
    });
    setStep('info');
  };

  const handleInfoSubmit = (info: AssessmentInfo) => {
    setAssessmentInfo(info);
    setStep('questionnaire');
  };

  const handleAnswer = (questionId: number, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentQuestion < ASRS_QUESTIONS.length - 1) {
      // Go to next question
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete assessment and go to results
      analytics.assessment.complete({
        test_type: 'adult_adhd_asrs',
        result: calculatePartAScoreFromAnswers(newAnswers),
        duration_ms: 0, // Could track this later
        recommendations: getRecommendedGames(calculatePartAScoreFromAnswers(newAnswers))
      });
      setStep('results');
    }
  };

  // Helper function to calculate Part A score from answers
  const calculatePartAScoreFromAnswers = (answersObj: typeof answers) => {
    const partAScoring = [2, 2, 2, 3, 3, 3];
    let partAScore = 0;
    
    for (let i = 1; i <= 6; i++) {
      const answer = answersObj[i] || 0;
      const threshold = partAScoring[i - 1];
      if (answer >= threshold) {
        partAScore++;
      }
    }
    
    return partAScore;
  };


  const calculatePartAScore = () => {
    const partAScoring = [2, 2, 2, 3, 3, 3];
    let partAScore = 0;
    
    for (let i = 1; i <= 6; i++) {
      const answer = answers[i] || 0;
      const threshold = partAScoring[i - 1];
      if (answer >= threshold) {
        partAScore++;
      }
    }
    
    return partAScore;
  };

  const calculateTotalScore = () => {
    return Object.values(answers).reduce((sum, value) => sum + value, 0);
  };

  const getRiskLevel = (): 'low' | 'moderate' | 'high' => {
    const partAScore = calculatePartAScore();
    if (partAScore >= 4) return 'high';
    if (partAScore >= 2) return 'moderate';
    return 'low';
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = ['intro', 'info', 'questionnaire', 'results'];
    const currentStepIndex = steps.indexOf(step);

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                index < currentStepIndex
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
                className={`w-12 h-0.5 transition-all ${
                  index < currentStepIndex ? "bg-green-600" : "bg-gray-300"
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
          <Link 
            href="/blog/adult-adhd-asrs-comprehensive-guide"
            prefetch={false}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {t('learnMore.linkText')}
            <ArrowRight size={14} />
          </Link>
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

      <form onSubmit={(e) => { e.preventDefault(); handleInfoSubmit(assessmentInfo); }} className="space-y-6">
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
  const renderQuestionnaire = () => {
    const question = ASRS_QUESTIONS[currentQuestion];
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('questionnaire.title')}
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              {currentQuestion + 1} / {ASRS_QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / ASRS_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <p className="text-lg text-gray-900 dark:text-white mb-6">
            {tQuestions(question.key)}
          </p>

          <div className="space-y-3">
            {[
              { value: 0, label: t('scale.never') },
              { value: 1, label: t('scale.rarely') },
              { value: 2, label: t('scale.sometimes') },
              { value: 3, label: t('scale.often') },
              { value: 4, label: t('scale.veryOften') }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
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
  };

  // Render results step
  const renderResults = () => {
    const partAScore = calculatePartAScore();
    const totalScore = calculateTotalScore();
    const riskLevel = getRiskLevel();
    const recommendedGames = getRecommendedGames(partAScore);

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
            <p><span className="font-medium">{tResults('totalQuestions')}:</span> {ASRS_QUESTIONS.length}</p>
            <p><span className="font-medium">{tResults('partAScore')}:</span> {partAScore}/6</p>
            <p><span className="font-medium">{tResults('totalScore')}:</span> {totalScore}</p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className={`border rounded-lg p-6 ${
          riskLevel === 'high' 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : riskLevel === 'moderate'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
          <h3 className="font-semibold mb-3">
            {tResults(`riskLevels.${riskLevel}.title`)}
          </h3>
          <p className="text-sm mb-4">
            {tResults(`riskLevels.${riskLevel}.description`)}
          </p>
          {riskLevel !== 'low' && (
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
            {recommendedGames.map((gameSlug) => (
              <Link key={gameSlug} href={`/games/${gameSlug}`} prefetch={false}>
                <button 
                  className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
                  onClick={() => {
                    analytics.navigation.recommendation({
                      from_page: 'adult-adhd-assessment',
                      to_page: `games/${gameSlug}`,
                      source: 'adult_adhd_assessment_recommendation',
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
              setCurrentQuestion(0);
              setAnswers({});
              setAssessmentInfo({ subject: '', age: '' });
            }}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {tResults('retakeAssessment')}
          </button>
          <Link href="/games" prefetch={false}>
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
