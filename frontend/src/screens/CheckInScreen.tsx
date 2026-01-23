import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ScrollView, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import api from '../services/api';

export default function CheckInScreen({ navigation }: any) {
    const [sleep, setSleep] = useState(3);
    const [stress, setStress] = useState(3);
    const [connection, setConnection] = useState(3);
    const [note, setNote] = useState('');

    const handleSubmit = async () => {
        try {
            await api.post('/checkins/', {
                sleep_quality: sleep,
                stress_level: stress,
                connection_felt: connection,
                note: note
            });
            Alert.alert("Saved", "Daily check-in recorded!");
            navigation.goBack();
        } catch (e: any) {
             Alert.alert("Error", e.response?.data?.detail || "Could not save check-in");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Daily Check-In</Text>
            
            <View style={styles.section}>
                <Text>Sleep Quality (1-5): {sleep}</Text>
                <Slider 
                    style={{width: '100%', height: 40}}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={sleep}
                    onValueChange={setSleep}
                />
            </View>

            <View style={styles.section}>
                <Text>Stress Level (1-5): {stress}</Text>
                <Slider 
                    style={{width: '100%', height: 40}}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={stress}
                    onValueChange={setStress}
                />
            </View>

            <View style={styles.section}>
                <Text>Connection Felt (1-5): {connection}</Text>
                <Slider 
                    style={{width: '100%', height: 40}}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={connection}
                    onValueChange={setConnection}
                />
            </View>

            <View style={styles.section}>
                <Text>Note (Optional):</Text>
                <TextInput 
                    style={styles.input} 
                    value={note}
                    onChangeText={setNote}
                    maxLength={140}
                    placeholder="How was your day?"
                    multiline
                />
                <Text style={{textAlign:'right', color:'#666'}}>{note.length}/140</Text>
            </View>

            <Button title="Save Check-In" onPress={handleSubmit} color="#FF69B4" />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    section: { marginBottom: 20 },
    input: { borderColor: '#ccc', borderWidth: 1, padding: 10, borderRadius: 5, height: 80, textAlignVertical: 'top' }
});
