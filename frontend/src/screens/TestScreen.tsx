import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function TestScreen({ navigation }: any) {
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const res = await api.get('/tests/questions');
            setQuestions(res.data);
            setCurrentQuestion(res.data[Math.floor(Math.random() * res.data.length)]);
        } catch (e) {
            console.log(e);
        }
    };

    const submitAnswer = async (selectedAnswer: string) => {
        try {
            await api.post('/tests/', {
                question: currentQuestion,
                answer: selectedAnswer
            });
            Alert.alert("Saved", "Response recorded!");
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", "Could not save response");
        }
    };

    const options = ["Better", "Neutral", "Worse"]; // Example options for simplicity

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quick Emotional Test</Text>
            
            <View style={styles.card}>
                <Text style={styles.question}>{currentQuestion}</Text>
            </View>

            <View style={styles.options}>
                <Button title="Need Support" onPress={() => submitAnswer("Need Support")} />
                <View style={{height: 10}} />
                <Button title="Feeling Great" onPress={() => submitAnswer("Feeling Great")} />
                <View style={{height: 10}} />
                <Button title="Just Okay" onPress={() => submitAnswer("Just Okay")} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
    card: { backgroundColor: '#f0f0f0', padding: 20, borderRadius: 10, marginBottom: 30 },
    question: { fontSize: 18, textAlign: 'center' },
    options: { width: '100%'}
});
