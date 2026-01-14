import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import api from '../services/api';
import MoodSelector from '../components/MoodSelector';
import { useAuth } from '../context/AuthContext';

export default function MoodScreen({ navigation }: any) {
    const { user, setUser } = useAuth();
    const [text, setText] = useState('');
    const [mood, setMood] = useState(user?.current_mood || 3);

    const handleSubmit = async () => {
        try {
            await api.post('/entries/', { text, mood });
            // Also update user mood status
            const res = await api.put('/users/me/mood', { mood });
            await setUser(res.data);
            
            Alert.alert("Success", "Entry added & Mood updated!");
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", "Could not add entry");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>How are you feeling?</Text>
            <MoodSelector value={mood} onChange={setMood} character={user?.character || 'owl'} />
            
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
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    label: { fontSize: 18, marginBottom: 10, marginTop: 20, fontWeight: 'bold' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, textAlignVertical: 'top', marginBottom: 20 },
});
