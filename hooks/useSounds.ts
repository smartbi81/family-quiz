import { useMemo, useCallback } from 'react';

// Use a map to manage audio instances and prevent creating new ones on every call
const audioCache = new Map<string, HTMLAudioElement>();

const getAudio = (src: string) => {
    if (audioCache.has(src)) {
        return audioCache.get(src)!;
    }
    const audio = new Audio(src);
    audioCache.set(src, audio);
    return audio;
};


const playSound = (audio: HTMLAudioElement, volume: number) => {
    audio.volume = volume;
    // Allows re-playing the sound even if it's not finished
    audio.currentTime = 0;
    audio.play().catch(e => {
        // Autoplay policy can block this. It's fine to ignore the error.
        // console.error("Error playing sound:", e);
    });
};

const SOUND_URLS = {
    click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_28b1f511b8.mp3',
    pop: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c3b944482d.mp3',
    transition: 'https://cdn.pixabay.com/audio/2022/11/17/audio_82189a3939.mp3',
    questionIntro: 'https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c342f5.mp3'
};

export const useSounds = () => {
    const audioInstances = useMemo(() => ({
        click: getAudio(SOUND_URLS.click),
        pop: getAudio(SOUND_URLS.pop),
        transition: getAudio(SOUND_URLS.transition),
        questionIntro: getAudio(SOUND_URLS.questionIntro),
    }), []);

    const playClick = useCallback(() => playSound(audioInstances.click, 0.7), [audioInstances.click]);
    const playPop = useCallback(() => playSound(audioInstances.pop, 0.5), [audioInstances.pop]);
    const playTransition = useCallback(() => playSound(audioInstances.transition, 0.4), [audioInstances.transition]);
    const playQuestionIntro = useCallback(() => playSound(audioInstances.questionIntro, 0.6), [audioInstances.questionIntro]);

    return { playClick, playPop, playTransition, playQuestionIntro };
};
