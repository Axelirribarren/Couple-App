import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface MoodSelectorProps {
    value: number;
    onChange: (mood: number) => void;
    character?: string;
}

const getMoodImage = (character: string, mood: number) => {
    const char = character || 'owl'; // Default to owl
    if (char === 'alien') {
        switch(mood) {
            case 1: return require('../img/alien/alien-1.png');
            case 2: return require('../img/alien/alien-2.png');
            case 3: return require('../img/alien/alien-3.png');
            case 4: return require('../img/alien/alien-4.png');
            case 5: return require('../img/alien/alien-5.png');
        }
    } else {
        switch(mood) {
            case 1: return require('../img/owl/owl-1.png');
            case 2: return require('../img/owl/owl-2.png');
            case 3: return require('../img/owl/owl-3.png');
            case 4: return require('../img/owl/owl-4.png');
            case 5: return require('../img/owl/owl-5.png');
        }
    }
    return require('../img/owl/owl-3.png');
};

export default function MoodSelector({ value, onChange, character }: MoodSelectorProps) {
    const moods = [1, 2, 3, 4, 5];
    return (
        <View style={styles.container}>
            {moods.map((m) => (
                <TouchableOpacity
                    key={m}
                    style={[styles.button, value === m && styles.selected]}
                    onPress={() => onChange(m)}
                >
                    <Image source={getMoodImage(character || 'owl', m)} style={styles.image} />
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selected: {
        borderColor: '#FF69B4',
        backgroundColor: '#FFF0F5',
    },
    image: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
});
