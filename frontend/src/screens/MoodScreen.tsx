import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import api from '../services/api';
import MoodSelector from '../components/MoodSelector';

export default function MoodScreen({ navigation }: any) {
    const [text, setText] = useState('');
    const [mood, setMood] = useState(3);

    const handleSubmit = async () => {
        try {
            await api.post('/entries/', { text, mood });
            Alert.alert("Success", "Entry added!");
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", "Could not add entry");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>How are you feeling?</Text>
            <MoodSelector value={mood} onChange={setMood} />
            
            <Text style={styles.label}>Journal:</Text>
            <TextInput
                style={styles.input}
                multiline
                numberOfLines={4}
                value={text}
                onChangeText={setText}
                placeholder="Write about your day..."
            />
            <Button title="Save" onPress={handleSubmit} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 18, marginBottom: 10, marginTop: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, textAlignVertical: 'top', marginBottom: 20 },
});
