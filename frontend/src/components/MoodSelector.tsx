import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MoodSelectorProps {
    value: number;
    onChange: (mood: number) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
    const moods = [1, 2, 3, 4, 5];
    return (
        <View style={styles.container}>
            {moods.map((m) => (
                <TouchableOpacity
                    key={m}
                    style={[styles.button, value === m && styles.selected]}
                    onPress={() => onChange(m)}
                >
                    <Text style={styles.text}>{m}</Text>
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selected: {
        backgroundColor: '#FF69B4', // HotPink
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
