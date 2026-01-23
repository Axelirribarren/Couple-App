import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, RefreshControl, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function HomeScreen({ navigation }: any) {
    const { user, logout, refreshUser } = useAuth();
    const [timeline, setTimeline] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [linkCode, setLinkCode] = useState('');

    const loadData = async () => {
        try {
            const res = await api.get('/timeline/');
            setTimeline(res.data);
        } catch (e) {
            console.log("Error loading timeline", e);
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

    const renderCard = (item: any, index: number) => {
        const isMine = item.data.user_id === user?.id;
        const color = isMine ? '#E3F2FD' : '#FCE4EC'; // Blue for me, Pink for partner
        
        if (item.type === 'mood') {
            return (
                <View key={index} style={[styles.card, { backgroundColor: color }]}>
                    <Text style={styles.cardHeader}>{isMine ? "Me" : "Partner"} - Mood</Text>
                    <Text style={styles.cardText}>Mood: {item.data.mood}/5</Text>
                    <Text style={styles.cardText}>{item.data.text}</Text>
                    <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
                </View>
            );
        } else if (item.type === 'checkin') {
             return (
                <View key={index} style={[styles.card, { backgroundColor: color, borderColor: '#FFD700', borderWidth: 1 }]}>
                    <Text style={styles.cardHeader}>{isMine ? "Me" : "Partner"} - Daily Check-In</Text>
                    <Text>Sleep: {item.data.sleep_quality}/5</Text>
                    <Text>Stress: {item.data.stress_level}/5</Text>
                    <Text>Connection: {item.data.connection_felt}/5</Text>
                    {item.data.note && <Text style={{fontStyle:'italic', marginTop:5}}>"{item.data.note}"</Text>}
                    <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
                </View>
            );
        } else if (item.type === 'test') {
             return (
                <View key={index} style={[styles.card, { backgroundColor: color, borderColor: '#9C27B0', borderWidth: 1 }]}>
                    <Text style={styles.cardHeader}>{isMine ? "Me" : "Partner"} - Emotional Test</Text>
                    <Text style={styles.question}>{item.data.question}</Text>
                    <Text style={styles.answer}>Answer: {item.data.answer}</Text>
                    <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
                </View>
            );
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
            <View style={styles.actions}>
                <Button title="Add Mood" onPress={() => navigation.navigate('Mood')} />
                <Button title="Daily Check-In" onPress={() => navigation.navigate('CheckIn')} color="#FF69B4" />
                <Button title="Take Test" onPress={() => navigation.navigate('Test')} color="#9C27B0" />
            </View>

            <Text style={styles.sectionTitle}>Timeline</Text>
            {timeline.length > 0 ? timeline.map(renderCard) : <Text>No activity yet.</Text>}
            
            <View style={{height: 20}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    scrollContainer: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 1 },
    cardHeader: { fontWeight: 'bold', marginBottom: 5 },
    cardText: { fontSize: 16 },
    date: { fontSize: 12, color: 'gray', marginTop: 10, textAlign: 'right' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 10, borderRadius: 5 },
    actions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    question: { fontWeight: 'bold' },
    answer: { fontSize: 16, color: '#444' }
});
