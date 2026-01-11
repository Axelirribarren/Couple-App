import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, RefreshControl, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DailyEntry } from '../types';

export default function HomeScreen({ navigation }: any) {
    const { user, logout, refreshUser } = useAuth();
    const [myEntries, setMyEntries] = useState<DailyEntry[]>([]);
    const [partnerEntries, setPartnerEntries] = useState<DailyEntry[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [linkCode, setLinkCode] = useState('');

    const loadData = async () => {
        try {
            const myRes = await api.get('/entries/');
            setMyEntries(myRes.data);
            if (user?.partner_id) {
                const pRes = await api.get('/entries/partner');
                setPartnerEntries(pRes.data);
            }
        } catch (e) {
            console.log("Error loading entries", e);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshUser();
        await loadData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const generateCode = async () => {
        const res = await api.post('/partner/generate-code');
        Alert.alert("Your Code", res.data.code);
    };

    const linkPartner = async () => {
        try {
            await api.post(`/partner/link?code=${linkCode}`);
            Alert.alert("Success", "Linked with partner!");
            onRefresh();
        } catch (e: any) {
            Alert.alert("Error", e.response?.data?.detail || "Failed to link");
        }
    };

    if (!user?.partner_id) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Welcome {user?.email}</Text>
                <Text style={styles.subtitle}>Link with your partner to start!</Text>
                
                <View style={styles.card}>
                    <Button title="Generate My Code" onPress={generateCode} />
                </View>

                <View style={styles.card}>
                    <Text>Enter Partner Code:</Text>
                    <TextInput 
                        style={styles.input} 
                        value={linkCode} 
                        onChangeText={setLinkCode}
                        placeholder="UUID Code"
                    />
                    <Button title="Link Partner" onPress={linkPartner} />
                </View>
                <Button title="Logout" onPress={logout} color="red" />
            </View>
        );
    }

    return (
        <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
                <Button title="Logout" onPress={logout} color="red" />
            </View>

            <View style={styles.actions}>
                <Button title="Add Mood" onPress={() => navigation.navigate('Mood')} />
                <Button title="Photos" onPress={() => navigation.navigate('Photos')} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Latest Mood</Text>
                {myEntries.length > 0 ? (
                     <Text>Mood: {myEntries[myEntries.length-1].mood} - {myEntries[myEntries.length-1].text}</Text>
                ) : <Text>No entries yet.</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Partner's Latest Mood</Text>
                {partnerEntries.length > 0 ? (
                     <Text>Mood: {partnerEntries[partnerEntries.length-1].mood} - {partnerEntries[partnerEntries.length-1].text}</Text>
                ) : <Text>No entries yet.</Text>}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    scrollContainer: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 10, borderRadius: 5 },
    actions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    section: { marginBottom: 20, padding: 15, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
});
