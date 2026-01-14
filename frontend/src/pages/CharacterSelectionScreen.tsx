import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CharacterSelectionScreen({ navigation }: any) {
    const { user, setUser } = useAuth();
    const [selected, setSelected] = useState<'owl' | 'alien' | null>(null);

    const handleSave = async () => {
        if (!selected) return;
        try {
            const res = await api.put('/users/me/character', { character: selected });
            setUser(res.data);
            // Navigate to Main or Mood
            navigation.replace('Home'); 
        } catch (e: any) {
            console.error("Save Character Error:", e.response?.data || e.message);
            Alert.alert("Error", `Could not save character selection. ${e.response?.status ? 'Status: ' + e.response.status : ''} ${e.response?.data?.detail || ''}`);
        }

    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Choose your Character</Text>
            <View style={styles.selectionContainer}>
                <TouchableOpacity 
                    style={[styles.card, selected === 'owl' && styles.selected]} 
                    onPress={() => setSelected('owl')}
                >
                    <Image source={require('../img/owl/owl-3.png')} style={styles.image} />
                    <Text style={styles.label}>Owl</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.card, selected === 'alien' && styles.selected]} 
                    onPress={() => setSelected('alien')}
                >
                    <Image source={require('../img/alien/alien-3.png')} style={styles.image} />
                    <Text style={styles.label}>Alien</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity 
                style={[styles.button, !selected && styles.disabled]} 
                onPress={handleSave}
                disabled={!selected}
            >
                <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
    selectionContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 40 },
    card: { alignItems: 'center', padding: 20, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
    selected: { borderColor: '#FF69B4', backgroundColor: '#FFF0F5' },
    image: { width: 100, height: 100, marginBottom: 10, resizeMode: 'contain' },
    label: { fontSize: 18, fontWeight: 'bold' },
    button: { backgroundColor: '#FF69B4', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25 },
    disabled: { backgroundColor: '#ccc' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
