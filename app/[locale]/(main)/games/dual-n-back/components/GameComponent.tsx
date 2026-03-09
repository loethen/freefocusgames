import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { GAME_CONFIG } from "../config";
import { cn } from "@/lib/utils";
import { PlayCircle, Share2, Volume2, Square } from "lucide-react";
import { Howl } from "howler";
import { useInterval } from "@/hooks/useInterval";
import { useTimeout } from "@/hooks/useTimeout";
import confetti from "canvas-confetti";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { ShareModal } from "@/components/ui/ShareModal";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import GameSettings, { GameSettings as GameSettingsType } from "./GameSettings";
import GameDemo from "./GameDemo";
import { analytics } from "@/lib/analytics";

// 定义游戏状态类型
// 游戏状态：空闲、进行中、已完成
type GameState = "idle" | "playing" | "complete";
// 试验刺激类型：位置和字母
type TrialStimuli = { position: number; letter: string };
// 用户响应类型：位置匹配和音频匹配
type Response = { positionMatch: boolean | null; audioMatch: boolean | null };
// 试验结果类型：包含刺激、响应和正确性评估
type TrialResult = {
    stimuli: TrialStimuli;
    response: Response;
    isPositionMatch: boolean;
    isAudioMatch: boolean;
    isCorrectPositionResponse: boolean;
    isCorrectAudioResponse: boolean;
};
// 游戏设置类型
type GameSettings = {
    selectedNBack: number;
    voiceType: "male" | "female";
    selectedTypes: ("position" | "audio")[];
    trialsPerRound: number;
    trialInterval: number;
};

// 添加 Props 类型定义
type GameComponentProps = {
    t?: ReturnType<typeof useTranslations>;
};

// 游戏设置自定义钩子
function useGameSettings() {
    // 获取当前语言
    const locale = useLocale();
    
    // 默认游戏设置
    const [settings, setSettings] = useState<GameSettingsType>({
        selectedNBack: GAME_CONFIG.difficulty.initialLevel,      // 默认N-back等级
        voiceType: locale === "zh" ? "female" : "male",      // 中文环境默认使用女声，但不是中文女声
        selectedTypes: ["position", "audio"], // 默认启用双模式
        trialsPerRound: GAME_CONFIG.trials.perRound, // 默认每轮试验次数
        trialInterval: GAME_CONFIG.trials.interval, // 默认试验间隔
    });

    // 安全更新设置的方法
    const updateSettings = useCallback((newSettings: GameSettingsType) => {
        // 追踪设置变化（仅在开发环境或重要变化时）
        if (typeof window !== 'undefined' && newSettings.selectedNBack !== settings.selectedNBack) {
            analytics.game.settings({
                game_id: 'dual-n-back',
                setting_changed: 'difficulty_level',
                level: newSettings.selectedNBack
            });
        }
        
        setSettings(newSettings);
    }, [settings.selectedNBack]);

    return { settings, updateSettings };
}

export default function GameComponent({ t: propT }: GameComponentProps) {
    // 如果提供了 t prop，则使用它，否则使用 useTranslations 获取
    const defaultT = useTranslations('games.dualNBack.gameUI');
    const t = propT || defaultT;
    
    const { settings, updateSettings } = useGameSettings();
    
    // 原useGameLogic中的状态
    const [gameState, setGameState] = useState<GameState>("idle");
    const [currentTrial, setCurrentTrial] = useState(0); // 当前试验次数
    const [trialHistory, setTrialHistory] = useState<TrialStimuli[]>([]); // 试验历史记录
    const [results, setResults] = useState<TrialResult[]>([]); // 所有试验结果存储
    const [currentResponse, setCurrentResponse] = useState<Response>({
        positionMatch: null,
        audioMatch: null,
    });
    
    // 保留其他状态...
    const [activePosition, setActivePosition] = useState<number | null>(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isPositionHighlight, setIsPositionHighlight] = useState(false);
    const [isAudioHighlight, setIsAudioHighlight] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // 添加一个状态来存储当前游戏会话的字母集
    const [sessionLetters, setSessionLetters] = useState<string[]>([]);
    const [startDelay, setStartDelay] = useState<number | null>(null);
    const [intervalDelay, setIntervalDelay] = useState<number | null>(null); // 试验间隔
    const audioRefs = useRef<{ [key: string]: Howl }>({});      // 音频引用缓存
    const [gameStartTime, setGameStartTime] = useState<number>(0); // 游戏开始时间

    // 添加滚动容器的ref
    const gameContainerRef = useRef<HTMLDivElement>(null);

    // 准确率计算
    const accuracy = {
        position: {
            correct: 0,
            total: 0,
            missed: 0,
            falseAlarms: 0,
        },
        audio: {
            correct: 0,
            total: 0,
            missed: 0,
            falseAlarms: 0,
        },
    };
    
    // 计算准确率
    results.forEach((result) => {
        if (settings.selectedTypes.includes("position")) {
            if (result.isPositionMatch) {
                accuracy.position.total++;
                if (result.isCorrectPositionResponse) {
                    accuracy.position.correct++;
                } else {
                    accuracy.position.missed++;
                }
            } else if (result.response.positionMatch) {
                accuracy.position.falseAlarms++;
            }
        }
        
        if (settings.selectedTypes.includes("audio")) {
            if (result.isAudioMatch) {
                accuracy.audio.total++;
                if (result.isCorrectAudioResponse) {
                    accuracy.audio.correct++;
                } else {
                    accuracy.audio.missed++;
                }
            } else if (result.response.audioMatch) {
                accuracy.audio.falseAlarms++;
            }
        }
    });

    const startGame = useCallback(() => {
        // 记录游戏开始时间和追踪事件
        const startTime = Date.now();
        setGameStartTime(startTime);
        
        // 追踪游戏开始事件
        analytics.game.start({
            game_id: 'dual-n-back',
            mode: settings.selectedTypes.join('-'),
            level: settings.selectedNBack,
            difficulty: settings.selectedNBack >= 3 ? 'hard' : settings.selectedNBack >= 2 ? 'medium' : 'easy'
        });
        
        setIsLoading(true);
        setGameState("idle");
        setCurrentTrial(0);
        setTrialHistory([]);
        setResults([]);
        
        // 延迟滚动确保布局更新完成
        setTimeout(() => {
            gameContainerRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'  // 改为从顶部对齐
            });
        }, 50);  // 50ms延迟确保状态更新
        
        // 为本局游戏随机选择8个字母
        const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const selectedLetters: string[] = [];
        
        // 随机选择8个不重复的字母
        while (selectedLetters.length < 8) {
            const randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)];
            if (!selectedLetters.includes(randomLetter)) {
                selectedLetters.push(randomLetter);
            }
        }
        
        setSessionLetters(selectedLetters);
        setStartDelay(null);
        setTimeout(() => {
            setStartDelay(GAME_CONFIG.trials.startDelay);
        }, 0);
    }, [settings.selectedTypes, settings.selectedNBack]);

    // 修改handleResponse方法
    const handleResponse = useCallback((type: "position" | "audio") => {
        // 设置高亮状态
        if (type === "position") {
            setIsPositionHighlight(true);
            setTimeout(() => setIsPositionHighlight(false), 300);
        } else {
            setIsAudioHighlight(true);
            setTimeout(() => setIsAudioHighlight(false), 300);
        }

        setCurrentResponse(prev => {
            // 如果已经响应过该类型，则不再更新
            if (prev[`${type}Match`] !== null) {
                return prev;
            }
            
            // Create the updated response
            const updatedResponse = {
                ...prev,
                [`${type}Match`]: true
            };
            
            return updatedResponse;
        });
    }, []);

    const evaluateResponse = useCallback((response: Response) => {
        if (trialHistory.length === 0) return; // Safety check
        
        const currentStimuli = trialHistory[trialHistory.length - 1];
        const nBackIndex = trialHistory.length - 1 - settings.selectedNBack;
        
        // Only evaluate if we have enough history
        if (nBackIndex < 0) return;
        
        const nBackStimuli = trialHistory[nBackIndex];
        
        const isPositionMatch = currentStimuli.position === nBackStimuli.position;
        const isAudioMatch = currentStimuli.letter === nBackStimuli.letter;
        
        // Create a new result object
        const newResult = {
            stimuli: currentStimuli,
            response,
            isPositionMatch,
            isAudioMatch,
            // Only evaluate position response if position is a selected type
            isCorrectPositionResponse: 
                !settings.selectedTypes.includes("position") ? true : // Always correct if not selected
                isPositionMatch ? 
                    response.positionMatch === true :  // 当有匹配时，必须响应true
                    response.positionMatch !== true,   // 当无匹配时，必须不响应true（可以是false或null）
            
            // Only evaluate audio response if audio is a selected type
            isCorrectAudioResponse: 
                !settings.selectedTypes.includes("audio") ? true : // Always correct if not selected
                isAudioMatch ? 
                    response.audioMatch === true : 
                    response.audioMatch !== true
        };
        
        setResults(prev => [...prev, newResult]);
    }, [trialHistory, settings.selectedNBack, settings.selectedTypes]);
    
    // 分享分数
    const shareScore = useCallback(() => {
        // 计算当前分数和准确率
        const correctResponses = results.filter(r => 
            (r.isPositionMatch ? r.isCorrectPositionResponse : r.response.positionMatch !== true) &&
            (r.isAudioMatch ? r.isCorrectAudioResponse : r.response.audioMatch !== true)
        );
        const accuracy = results.length > 0 ? Math.round((correctResponses.length / results.length) * 100) : 0;
        
        // 追踪分享事件
        analytics.social.share({
            game_id: 'dual-n-back',
            score: correctResponses.length,
            accuracy: accuracy
        });
        
        setShowShareModal(true);
    }, [results]);
    

    // 添加键盘快捷键支持
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (gameState !== "playing") return;

            if (e.key === "a" || e.key === "A") {
                handleResponse("position");
            } else if (e.key === "l" || e.key === "L") {
                handleResponse("audio");
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [gameState, handleResponse]);

    // 监听外部教程按钮点击
    useEffect(() => {
        const handleTutorialClick = () => {
            setShowTutorial(true);
        };

        const tutorialButton = document.getElementById('tutorial-trigger-howtoplay');
        if (tutorialButton) {
            tutorialButton.addEventListener('click', handleTutorialClick);
        }

        return () => {
            if (tutorialButton) {
                tutorialButton.removeEventListener('click', handleTutorialClick);
            }
        };
    }, []);

    // 定时器钩子：控制试验间隔
    useInterval(() => {
        if (currentTrial < settings.trialsPerRound) {
            setActivePosition(null); // 重置激活位置
            startNextTrial();
        } else {
            endGame();
            setIntervalDelay(null);
        }
    }, intervalDelay);

    // 延时钩子：控制游戏开始
    useTimeout(() => {
        if (startDelay !== null) {
            setGameState("playing");
            setCurrentTrial(0);
            setTrialHistory([]);
            setResults([]);
            setActivePosition(null);
            setCurrentResponse({ positionMatch: null, audioMatch: null });
            setIsLoading(false);
            startNextTrial();
            setIntervalDelay(settings.trialInterval); // 修复：直接设为正常间隔
        }
    }, startDelay);

    // 在intervalDelay变为0后设置为正确的值
    useEffect(() => {
        if (intervalDelay === 0) {
            setIntervalDelay(settings.trialInterval);
        }
    }, [intervalDelay, settings.trialInterval]);

    // 修改加载音频文件的useEffect
    useEffect(() => {
        // 在 effect 中保存对 audioRefs.current 的引用
        const currentAudioRefs = audioRefs.current;
        
        // 清除之前的音频引用
        Object.values(currentAudioRefs).forEach((audio) => audio.unload());
        
        // 只加载本局游戏需要的字母音频
        sessionLetters.forEach((letter) => {
            currentAudioRefs[letter] = new Howl({
                src: [`${GAME_CONFIG.audio.basePath}${
                    GAME_CONFIG.audio.voices[settings.voiceType]
                }${letter.toLowerCase()}.mp3`],
                onplay: () => setIsAudioPlaying(true),
                onend: () => setIsAudioPlaying(false),
            });
        });
        
        // 使用保存的引用进行清理
        return () => Object.values(currentAudioRefs).forEach((audio) => audio.unload());
    }, [settings.voiceType, sessionLetters]);

    // 结束游戏并计算准确率
    const endGame = useCallback(() => {
        setGameState("complete");
        setIntervalDelay(null);
        
        // 计算游戏统计数据
        const gameDuration = gameStartTime > 0 ? Date.now() - gameStartTime : 0;
        const correctResponses = results.filter(r => 
            (r.isPositionMatch ? r.isCorrectPositionResponse : r.response.positionMatch !== true) &&
            (r.isAudioMatch ? r.isCorrectAudioResponse : r.response.audioMatch !== true)
        );
        const accuracy = results.length > 0 ? Math.round((correctResponses.length / results.length) * 100) : 0;
        
        // 追踪游戏完成事件
        analytics.game.complete({
            game_id: 'dual-n-back',
            mode: settings.selectedTypes.join('-'),
            level: settings.selectedNBack,
            score: correctResponses.length,
            duration_ms: gameDuration,
            accuracy: accuracy,
            difficulty: settings.selectedNBack >= 3 ? 'hard' : settings.selectedNBack >= 2 ? 'medium' : 'easy'
        });
        
        // 触发胜利动画
        const isPerfectScore = results.every(r => 
            (r.isPositionMatch ? r.isCorrectPositionResponse : r.response.positionMatch !== true) &&
            (r.isAudioMatch ? r.isCorrectAudioResponse : r.response.audioMatch !== true)
        );
        
        if (isPerfectScore) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [results, settings.selectedTypes, settings.selectedNBack, gameStartTime]);

    // 修改生成随机试验刺激的函数
    const generateTrial = useCallback((): TrialStimuli => {
        // 随机生成位置（0-8对应3x3网格）
        const position = Math.floor(Math.random() * 9);
        
        // 从本局游戏的字母集中随机选择一个字母
        const letter = sessionLetters[Math.floor(Math.random() * sessionLetters.length)];
        
        return { position, letter };
    }, [sessionLetters]);

    // 开始下一个试验的核心逻辑
    const startNextTrial = useCallback(() => {
        if (currentTrial >= settings.trialsPerRound) {
            endGame();
            return;
        }

        // Evaluate the previous trial's response if it exists
        if (currentTrial > 0 && trialHistory.length > 0) {
            evaluateResponse(currentResponse);
        }

        // 生成新刺激，有20%概率创建匹配项
        const newStimuli = generateTrial();
        let positionStimuli = newStimuli.position;
        let letterStimuli = newStimuli.letter;

        // 当有足够历史记录时，按概率创建匹配
        if (trialHistory.length >= settings.selectedNBack) {
            const nBackTrial = trialHistory[trialHistory.length - settings.selectedNBack];
            
            // 只为选中的训练模式创建匹配
            if (settings.selectedTypes.includes("position") && Math.random() < 0.2) {
                positionStimuli = nBackTrial.position;
            }
            
            if (settings.selectedTypes.includes("audio") && Math.random() < 0.2) {
                letterStimuli = nBackTrial.letter;
            }
        }

        // 最终确定的刺激
        const finalStimuli = { position: positionStimuli, letter: letterStimuli };
        
        // 更新界面状态 - 只在需要时显示位置刺激
        if (settings.selectedTypes.includes("position")) {
            setActivePosition(finalStimuli.position);  // 显示位置刺激
        } else {
            setActivePosition(null); // 不显示位置刺激
        }
        
        // 只在需要时播放音频
        if (settings.selectedTypes.includes("audio") && audioRefs.current[finalStimuli.letter]) {
            audioRefs.current[finalStimuli.letter].play(); // 播放音频
        }
        
        // 重置用户响应状态
        setCurrentResponse({ positionMatch: null, audioMatch: null });
        
        // 更新试验历史（保留最近N次记录）
        setTrialHistory(prev => [...prev, finalStimuli]);

        // 更新试验计数
        setCurrentTrial(prev => prev + 1);
        
        // 设置下一个试验的间隔
        setIntervalDelay(settings.trialInterval);
    }, [currentTrial, generateTrial, settings.selectedNBack, settings.trialsPerRound, settings.trialInterval, settings.selectedTypes, trialHistory, endGame, evaluateResponse, currentResponse]);

    // 渲染游戏界面
    return (
        <div className="space-y-8 max-w-lg mx-auto">
            <div 
                className="mx-auto p-2 flex flex-col justify-center" 
                style={{ scrollMarginTop: "100px" }}
                ref={gameContainerRef}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                                {settings.selectedTypes.length === 2
                                    ? t('dual')
                                    : t(`${settings.selectedTypes[0]}`)}
                            </span>
                            <span>•</span>
                            <span className="font-medium">
                                {t('back', { level: settings.selectedNBack })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <GameSettings 
                            settings={settings}
                            onSettingsChange={updateSettings}
                            disabled={gameState === "playing"}
                        />
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
                    {gameState === "idle" ? (
                        <div className="text-center py-8">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold mb-4 text-primary">
                                    {t('challenge')}
                                </h3>
                                <p className="text-lg text-muted-foreground mb-6">
                                    {t('improveMemorySubtitle')}
                                </p>
                            </div>
                            
                            
                            <div className="space-y-4">
                                <ShimmerButton
                                    onClick={startGame}
                                    disabled={isLoading}
                                    className="w-full py-4"
                                >
                                    <span className="flex items-center justify-center text-white text-lg">
                                        <PlayCircle className="w-6 h-6 mr-2" />
                                        {isLoading ? t('starting') : t('startTraining')}
                                    </span>
                                </ShimmerButton>
                                
                                <div className="text-center">
                                    <Link href="/get-started" target="_blank">
                                        <Button
                                            variant="ghost" 
                                            className="text-sm text-muted-foreground"
                                        >
                                            {t('testMyLevel')}
                                        </Button>
                                    </Link>
                                </div>
                                
                            </div>
                        </div>
                    ) : gameState === "playing" ? (
                        <div className="text-center py-6">
                            <div className="text-lg font-medium mb-4">
                                {t('trial', { current: currentTrial, total: settings.trialsPerRound })}
                            </div>

                            {/* Only show the grid if position is a selected type */}
                            {settings.selectedTypes.includes("position") && (
                                <div
                                    className={cn(
                                        "grid grid-cols-3 gap-2 mx-auto mb-6"
                                    )}
                                >
                                    {Array.from({ length: 9 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "aspect-square rounded-lg transition-all duration-300",
                                                activePosition === index
                                                    ? "bg-primary"
                                                    : "bg-foreground/5"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* If only audio is selected, show a visual indicator for audio */}
                            {!settings.selectedTypes.includes("position") &&
                                settings.selectedTypes.includes("audio") && (
                                    <div className="flex justify-center items-center h-32 mb-6">
                                        <div
                                            className={cn(
                                                "w-16 h-16 rounded-full flex items-center justify-center",
                                                isAudioPlaying
                                                    ? "bg-primary/20"
                                                    : "bg-foreground/5"
                                            )}
                                        >
                                            <Volume2
                                                className={cn(
                                                    "w-8 h-8",
                                                    isAudioPlaying
                                                        ? "text-primary animate-pulse"
                                                        : "text-muted-foreground"
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                            <div className="flex justify-center gap-4">
                                {settings.selectedTypes.includes("position") && (
                                    <Button
                                        onClick={() => handleResponse("position")}
                                        variant="ghost"
                                        className={cn(
                                            "border-2 rounded-full shadow-none",
                                            isPositionHighlight &&
                                                "hover:border-primary border-primary"
                                        )}
                                    >
                                        <Square className="w-4 h-4 mr-1 bg-primary" />
                                        {t('positionMatch')}
                                    </Button>
                                )}
                                {settings.selectedTypes.includes("audio") && (
                                    <Button
                                        onClick={() => handleResponse("audio")}
                                        variant="ghost"
                                        className={cn(
                                            "border-2 rounded-full shadow-none",
                                            isAudioHighlight &&
                                                "hover:border-primary border-primary"
                                        )}
                                    >
                                        <Volume2
                                            className={cn(
                                                "w-4 h-4 mr-1",
                                                isAudioPlaying && "animate-pulse"
                                            )}
                                        />
                                        {t('soundMatch')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <h2 className="text-xl font-bold mb-4">
                                {t('trainingResults')}
                            </h2>
                            <div className="bg-muted/30 p-6 rounded-lg mb-6 max-w-md mx-auto">
                                <div
                                    className={cn(
                                        "grid gap-6",
                                        settings.selectedTypes.length === 2
                                            ? "grid-cols-2"
                                            : "grid-cols-1"
                                    )}
                                >
                                    {settings.selectedTypes.includes(
                                        "position"
                                    ) && (
                                        <div
                                            className={cn(
                                                "space-y-3",
                                                settings.selectedTypes.length ===
                                                    2 && "border-r pr-4"
                                            )}
                                        >
                                            <h3 className="font-semibold text-primary">
                                                {t('position')}
                                            </h3>
                                            <div className="flex flex-col items-center">
                                                <div className="text-3xl font-bold">
                                                    {t('accuracy', { 
                                                        correct: accuracy.position.correct, 
                                                        total: accuracy.position.total 
                                                    })}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {t('accuracyPercent', { 
                                                        percent: accuracy.position.total > 0
                                                            ? Math.round(
                                                                (accuracy.position.correct /
                                                                    accuracy.position.total) *
                                                                100
                                                            )
                                                            : 0
                                                    })}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <div className="flex justify-between">
                                                    <span>{t('missed')}:</span>
                                                    <span>{accuracy.position.missed}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{t('falseAlarms')}:</span>
                                                    <span>{accuracy.position.falseAlarms}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {settings.selectedTypes.includes("audio") && (
                                        <div
                                            className={cn(
                                                "space-y-3",
                                                settings.selectedTypes.length ===
                                                    2 && "pl-2"
                                            )}
                                        >
                                            <h3 className="font-semibold text-primary">
                                                {t('sound')}
                                            </h3>
                                            <div className="flex flex-col items-center">
                                                <div className="text-3xl font-bold">
                                                    {t('accuracy', { 
                                                        correct: accuracy.audio.correct, 
                                                        total: accuracy.audio.total 
                                                    })}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {t('accuracyPercent', { 
                                                        percent: accuracy.audio.total > 0
                                                            ? Math.round(
                                                                (accuracy.audio.correct /
                                                                    accuracy.audio.total) *
                                                                100
                                                            )
                                                            : 0
                                                    })}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <div className="flex justify-between">
                                                    <span>{t('missed')}:</span>
                                                    <span>{accuracy.audio.missed}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{t('falseAlarms')}:</span>
                                                    <span>{accuracy.audio.falseAlarms}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-border/40">
                                    <div className="text-sm">
                                        {settings.selectedTypes.length === 2 && (
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">
                                                    {t('overallPerformance')}
                                                </span>
                                                <span className="font-bold">
                                                    {Math.round(
                                                        ((accuracy.position
                                                            .correct +
                                                            accuracy.audio
                                                                .correct) /
                                                        (accuracy.position
                                                            .total +
                                                            accuracy.audio
                                                                .total || 1)) *
                                                        100
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <p>
                                                {t('level')} {t('back', { level: settings.selectedNBack })} • {t('trials', { count: settings.trialsPerRound })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-center gap-4">
                                    <Button
                                        onClick={shareScore}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        {t('shareResults')}
                                    </Button>
                                    <Button
                                        onClick={startGame}
                                        className="flex items-center gap-2"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                        {t('playAgain')}
                                    </Button>
                                </div>
                                
                                <div className="p-4 bg-muted/20 rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-3 text-center">
                                        {t('continueTraining')}
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                analytics.navigation.recommendation({
                                                    game_from: 'dual-n-back',
                                                    game_to: 'schulte-table',
                                                    from_page: '/games/dual-n-back',
                                                    to_page: '/games/schulte-table'
                                                });
                                                window.location.href = '/games/schulte-table';
                                            }}
                                        >
                                            {t('schulteTable')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                analytics.navigation.recommendation({
                                                    game_from: 'dual-n-back',
                                                    game_to: 'stroop-test',
                                                    from_page: '/games/dual-n-back',
                                                    to_page: '/games/stroop-test'
                                                });
                                                window.location.href = '/games/stroop-test';
                                            }}
                                        >
                                            {t('stroopTest')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                analytics.navigation.recommendation({
                                                    game_from: 'dual-n-back',
                                                    game_to: 'all-games',
                                                    from_page: '/games/dual-n-back',
                                                    to_page: '/games'
                                                });
                                                window.location.href = '/games';
                                            }}
                                        >
                                            {t('allGames')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={t('challenge')}
                url={window.location.href}
            />
            
            <GameDemo
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                onComplete={() => {
                    // 教程完成后可以添加GA4事件追踪
                    analytics.engagement.pageTime('/games/dual-n-back/tutorial', 30000);
                }}
            />
        </div>
    );
}
