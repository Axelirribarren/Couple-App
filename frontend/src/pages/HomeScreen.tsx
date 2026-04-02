import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, RefreshControl, TextInput, Alert, TouchableOpacity, Modal, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DailyEntry } from '../types';
import { syncManager, SyncResponse } from '../services/syncManager';
import AvatarWidget from '../components/AvatarWidget';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import plansData from '../data/plans.json';

export default function HomeScreen({ navigation }: any) {
    const { user, logout, refreshUser } = useAuth();
    const [myEntries, setMyEntries] = useState<DailyEntry[]>([]);
    const [partnerEntries, setPartnerEntries] = useState<DailyEntry[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [linkCode, setLinkCode] = useState('');
    const [syncData, setSyncData] = useState<SyncResponse | null>(null);
    const [incomingSparks, setIncomingSparks] = useState<any[]>([]);
    const [activePolaroid, setActivePolaroid] = useState<any | null>(null);
    const [capsuleMsg, setCapsuleMsg] = useState<string | null>(null);
    const [shakeConfetti, setShakeConfetti] = useState(false);

    // Time Capsule Input Modal State
    const [isCapsuleModalVisible, setIsCapsuleModalVisible] = useState(false);
    const [capsuleInputText, setCapsuleInputText] = useState('');

    // Feature: Random Plan Generator
    const [randomPlan, setRandomPlan] = useState<string | null>(null);

    // Termómetro Modal
    const [isKarmaModalVisible, setIsKarmaModalVisible] = useState(false);
    const [karmaInputText, setKarmaInputText] = useState('');

    // Feature: Movie Mode
    const [isMovieModeActive, setIsMovieModeActive] = useState(false);
    const [movieChatText, setMovieChatText] = useState('');
    const [movieChats, setMovieChats] = useState<{id: string, text: string, mine: boolean}[]>([]);

    // Feature: Long Distance Mode
    const [isLongDistanceMode, setIsLongDistanceMode] = useState(false);
    const [reunionDate, setReunionDate] = useState<string | null>(null);
    const [partnerTimezoneOffset, setPartnerTimezoneOffset] = useState<string | null>(null);
    const [isReunionModalVisible, setIsReunionModalVisible] = useState(false);
    const [reunionInput, setReunionInput] = useState('');
    const [timezoneInput, setTimezoneInput] = useState('');
    const [currentTimePartner, setCurrentTimePartner] = useState<string>('');

    useEffect(() => {
        const loadLDRSettings = async () => {
            const savedDate = await AsyncStorage.getItem('reunion_date');
            const savedTz = await AsyncStorage.getItem('partner_tz');
            if (savedDate) {
                setReunionDate(savedDate);
                if (savedTz) {
                    setPartnerTimezoneOffset(savedTz);
                    setTimezoneInput(savedTz);
                }
                setIsLongDistanceMode(true);
            }
        };
        loadLDRSettings();
    }, []);

    // Live clock for partner timezone
    useEffect(() => {
        let interval: any;
        if (isLongDistanceMode && partnerTimezoneOffset !== null) {
            interval = setInterval(() => {
                const now = new Date();
                const offsetHours = parseFloat(partnerTimezoneOffset);
                if (!isNaN(offsetHours)) {
                    // Convert local time to UTC, then apply partner offset
                    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                    const partnerTime = new Date(utc + (3600000 * offsetHours));
                    const timeStr = partnerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setCurrentTimePartner(timeStr);
                }
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isLongDistanceMode, partnerTimezoneOffset]);

    const setLongDistanceDate = async () => {
        if (reunionInput) {
            await AsyncStorage.setItem('reunion_date', reunionInput);
            setReunionDate(reunionInput);
            if (timezoneInput) {
                await AsyncStorage.setItem('partner_tz', timezoneInput);
                setPartnerTimezoneOffset(timezoneInput);
            } else {
                await AsyncStorage.removeItem('partner_tz');
                setPartnerTimezoneOffset(null);
            }
            setIsLongDistanceMode(true);
        } else {
            await AsyncStorage.removeItem('reunion_date');
            await AsyncStorage.removeItem('partner_tz');
            setReunionDate(null);
            setPartnerTimezoneOffset(null);
            setIsLongDistanceMode(false);
        }
        setIsReunionModalVisible(false);
    };

    const sendMovieChat = async () => {
        if (!movieChatText.trim()) return;
        const msg = movieChatText;
        setMovieChatText('');
        setMovieChats(prev => [...prev, { id: Date.now().toString(), text: msg, mine: true }]);
        await syncManager.sendSpark('movie_chat', msg);
    };

    // Asymmetric Journal
    const [journalData, setJournalData] = useState<any>(null);
    const [journalInput, setJournalInput] = useState('');
    const [isJournalModalVisible, setIsJournalModalVisible] = useState(false);

    // Feature 7: Secret Signal
    const [tapCount, setTapCount] = useState(0);
    const [lastTapTime, setLastTapTime] = useState(0);

    const handleSecretTap = async () => {
        const now = Date.now();
        // If it's been more than 1 second since last tap, reset counter
        if (now - lastTapTime > 1000) {
            setTapCount(1);
        } else {
            setTapCount(prev => {
                const newCount = prev + 1;
                if (newCount === 3) {
                    // Triple tap detected! Send secret signal
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    syncManager.sendSpark('secret_signal');
                    // Don't show any alert to keep it "undercover"
                    return 0; // Reset
                }
                return newCount;
            });
        }
        setLastTapTime(now);
    };

    // Feature 4: Shake to Connect
    useEffect(() => {
        let lastShake = 0;
        const subscription = Accelerometer.addListener(async (accelerometerData) => {
            const { x, y, z } = accelerometerData;
            const acceleration = Math.sqrt(x * x + y * y + z * z);

            // 2.5G threshold for a strong shake
            if (acceleration > 2.5) {
                const now = Date.now();
                // Debounce shake detection (only one shake every 5 seconds)
                if (now - lastShake > 5000) {
                    lastShake = now;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

                    const response = await syncManager.reportShake();
                    if (response.synced) {
                        setShakeConfetti(true);
                        Alert.alert("✨ Magic Connection! ✨", "You and your partner shook your phones at the same time!");
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                        // Hide confetti after 5 seconds
                        setTimeout(() => setShakeConfetti(false), 5000);
                    }
                }
            }
        });

        // Set update interval (fast enough to detect shakes but not drain battery instantly)
        Accelerometer.setUpdateInterval(200);

        return () => subscription.remove();
    }, []);


    const loadData = async () => {
        try {
            // Background Dopaminergic Sync
            if (user?.partner_id) {
                const data = await syncManager.syncWithServer();
                if (data) {
                    setSyncData(data);

                    // Handle incoming sparks
                    if (data.sparks && data.sparks.length > 0) {
                        setIncomingSparks(data.sparks);
                    }
                }

                // Check Daily Journal
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
                const jRes = await api.get(`/sync/journal/${todayStr}`);
                setJournalData(jRes.data);
            }

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

    const sendHapticHeartbeat = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const success = await syncManager.sendSpark('haptic', 'heartbeat');
        if (success) {
            Alert.alert("Sent!", "Your partner will feel your heartbeat soon. 💓");
            loadData(); // To potentially update streak
        } else {
            Alert.alert("Error", "Could not send spark right now.");
        }
    };

    const openSpark = async (spark: any) => {
        if (spark.spark_type === 'haptic') {
            // Play haptic feedback for the user
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 300);
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }, 600);

            Alert.alert("💓 Haptic Spark", "You felt your partner's touch.");

            // Consume immediately for haptic
            await syncManager.consumeSpark(spark.id);
            setIncomingSparks(prev => prev.filter(s => s.id !== spark.id));
        } else if (spark.spark_type === 'polaroid') {
            // Display modal
            setActivePolaroid(spark);
        } else if (spark.spark_type === 'time_capsule') {
            // Append 'Z' to explicitly treat naive strings from backend as UTC, if missing.
            const unlockStr = spark.unlock_at?.endsWith('Z') ? spark.unlock_at : `${spark.unlock_at}Z`;

            if (unlockStr && new Date(unlockStr) > new Date()) {
                Alert.alert("⏳ Locked", `This capsule is locked until ${new Date(unlockStr).toLocaleString()}`);
            } else {
                setCapsuleMsg(spark.encrypted_payload);
                await syncManager.consumeSpark(spark.id);
                setIncomingSparks(prev => prev.filter(s => s.id !== spark.id));
            }
        } else if (spark.spark_type === 'secret_signal') {
            // Secret Signal: 3 discrete short bursts, no UI interruption
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 400);

            await syncManager.consumeSpark(spark.id);
            setIncomingSparks(prev => prev.filter(s => s.id !== spark.id));
        } else if (spark.spark_type === 'movie_chat') {
            // Ephemeral chat spark
            setMovieChats(prev => [...prev, { id: spark.id.toString(), text: spark.encrypted_payload, mine: false }]);
            if (!isMovieModeActive) {
                Alert.alert("🍿 Movie Mode", `Partner says: "${spark.encrypted_payload}"`);
            }
            await syncManager.consumeSpark(spark.id);
            setIncomingSparks(prev => prev.filter(s => s.id !== spark.id));
        }
    };

    const handleSendTimeCapsule = async () => {
        if (!capsuleInputText.trim()) {
            Alert.alert("Error", "Message cannot be empty.");
            return;
        }

        setIsCapsuleModalVisible(false);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const success = await syncManager.sendSpark('time_capsule', capsuleInputText, tomorrow.toISOString());
        if (success) {
            Alert.alert("Sent!", "Time capsule sent. It will unlock tomorrow.");
            setCapsuleInputText('');
        } else {
            Alert.alert("Error", "Could not send time capsule.");
        }
    };

    const closePolaroid = async () => {
        if (activePolaroid) {
            // Consume the spark so it disappears forever (Snapchat style)
            await syncManager.consumeSpark(activePolaroid.id);
            // Remove from local UI state
            setIncomingSparks(prev => prev.filter(s => s.id !== activePolaroid.id));
            setActivePolaroid(null);
        }
    };

    const generateRandomPlan = () => {
        const randomIndex = Math.floor(Math.random() * plansData.length);
        setRandomPlan(plansData[randomIndex]);
    };

    const handleRecordFavor = async () => {
        if (!karmaInputText.trim()) {
            Alert.alert("Error", "Please write what they did!");
            return;
        }
        setIsKarmaModalVisible(false);
        await syncManager.incrementPartnerKarma();

        // Log it as an entry to keep the memory alive
        try {
            await api.post('/entries/', { text: `Termómetro de Deuda: Partner did something nice: ${karmaInputText}`, mood: 5 });
        } catch(e) {}

        setKarmaInputText('');
        Alert.alert("Recorded!", "You acknowledged their nice gesture. Their karma increased! 😇");
        loadData();
    };

    const handleSubmitJournal = async () => {
        if (!journalInput.trim()) {
            Alert.alert("Error", "Please write an answer.");
            return;
        }

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;

        try {
            const res = await api.post('/sync/journal', {
                date_str: todayStr,
                answer: journalInput
            });
            setJournalData(res.data);
            setIsJournalModalVisible(false);
            setJournalInput('');

            // Log locally as memory
            await api.post('/entries/', { text: `Asymmetric Journal Answer: ${journalInput}`, mood: 3 });
        } catch(e) {
            console.error(e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [user])
    );

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

    if (isMovieModeActive) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <Text style={{color: '#ff4500', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center'}}>
                    🍿 Movie Mode
                </Text>
                <Text style={{color: '#888', textAlign: 'center', marginBottom: 20}}>
                    Distractions off. Just you two and the screen.
                </Text>

                <ScrollView style={{flex: 1, marginBottom: 10}}>
                    {movieChats.map(chat => (
                        <View key={chat.id} style={{
                            alignSelf: chat.mine ? 'flex-end' : 'flex-start',
                            backgroundColor: chat.mine ? '#4b0082' : '#333',
                            padding: 10,
                            borderRadius: 15,
                            marginVertical: 5,
                            maxWidth: '80%'
                        }}>
                            <Text style={{color: 'white'}}>{chat.text}</Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TextInput
                        style={[styles.input, {flex: 1, backgroundColor: '#222', color: 'white', borderColor: '#444', marginBottom: 0}]}
                        placeholder="Whisper something..."
                        placeholderTextColor="#666"
                        value={movieChatText}
                        onChangeText={setMovieChatText}
                    />
                    <TouchableOpacity onPress={sendMovieChat} style={{marginLeft: 10, backgroundColor: '#ff4500', padding: 12, borderRadius: 25}}>
                        <Text style={{color: 'white', fontWeight: 'bold'}}>Send</Text>
                    </TouchableOpacity>
                </View>

                <Button title="Exit Movie Mode" color="#888" onPress={() => {
                    setIsMovieModeActive(false);
                    setMovieChats([]); // Ephemeral chat is wiped when exiting
                }} />
            </View>
        );
    }

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
            contentContainerStyle={[styles.scrollContainer, shakeConfetti && { backgroundColor: '#ffe4e1' }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Time Capsule Input Modal for Cross-Platform compatibility */}
            <Modal visible={isCapsuleModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.polaroidContainer}>
                        <Text style={styles.polaroidTitle}>Time Capsule ⏳</Text>
                        <Text style={{marginBottom: 10, color: '#666'}}>Write a message for your partner. It will unlock tomorrow.</Text>
                        <TextInput
                            style={[styles.input, { width: '100%', height: 100, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="I hope you're having a great day..."
                            value={capsuleInputText}
                            onChangeText={setCapsuleInputText}
                        />
                        <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10}}>
                            <Button title="Cancel" color="#888" onPress={() => setIsCapsuleModalVisible(false)} />
                            <Button title="Send" color="#8a2be2" onPress={handleSendTimeCapsule} />
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={!!randomPlan} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.polaroidContainer}>
                        <Text style={styles.polaroidTitle}>Random Plan 🎲</Text>
                        <Text style={[styles.polaroidDesc, { fontSize: 18, color: '#333', marginVertical: 20 }]}>{randomPlan}</Text>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                            <Button title="Reroll 🎲" color="#888" onPress={generateRandomPlan} />
                            <Button title="Awesome!" color="#3cb371" onPress={() => setRandomPlan(null)} />
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={!!capsuleMsg} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.polaroidContainer}>
                        <Text style={styles.polaroidTitle}>⏳ Time Capsule Unlocked!</Text>
                        <Text style={[styles.polaroidDesc, { fontSize: 18, color: '#333' }]}>{capsuleMsg}</Text>
                        <TouchableOpacity style={styles.polaroidCloseBtn} onPress={() => setCapsuleMsg(null)}>
                            <Text style={styles.polaroidCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={!!activePolaroid}
                animationType="fade"
                transparent={true}
                onRequestClose={closePolaroid}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.polaroidContainer}>
                        <Text style={styles.polaroidTitle}>Mystery Polaroid 📸</Text>
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${activePolaroid?.encrypted_payload}` }}
                            style={styles.polaroidImage}
                        />
                        <Text style={styles.polaroidDesc}>Your partner sent you a snapshot of their day. It will disappear after you close this!</Text>
                        <TouchableOpacity style={styles.polaroidCloseBtn} onPress={closePolaroid}>
                            <Text style={styles.polaroidCloseText}>Close and delete forever</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
                <Button title="Logout" onPress={logout} color="red" />
            </View>

            {/* Incoming Sparks Banner */}
            {incomingSparks.length > 0 && (
                <View style={styles.sparkBanner}>
                    <Text style={styles.sparkText}>✨ You have {incomingSparks.length} new spark(s)!</Text>
                    {incomingSparks.map(spark => {
                        const unlockStr = spark.unlock_at?.endsWith('Z') ? spark.unlock_at : `${spark.unlock_at}Z`;
                        const isLocked = spark.spark_type === 'time_capsule' && unlockStr && new Date(unlockStr) > new Date();
                        return (
                            <TouchableOpacity key={spark.id} style={[styles.sparkButton, isLocked && { backgroundColor: '#888' }]} onPress={() => openSpark(spark)}>
                                <Text style={styles.sparkButtonText}>
                                    {spark.spark_type === 'haptic' ? 'Feel Heartbeat 💓' :
                                     spark.spark_type === 'polaroid' ? 'Open Polaroid 📸' :
                                     isLocked ? `Locked Capsule ⏳` : 'Open Capsule ✨'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Conflict Predictor Banner */}
            {syncManager.isConflictPredicted && (
                <View style={styles.conflictBanner}>
                    <Text style={styles.conflictText}>💙 We noticed both of you are feeling a bit down. Taking a moment for a quiet chat might help.</Text>
                </View>
            )}

            {/* Relationship Tamagotchi */}
            <View style={styles.tamagotchiContainer}>
                <Text style={styles.tamagotchiTitle}>Our Tree 🌳</Text>
                <Text style={styles.tamagotchiEmoji}>
                    {syncData && syncData.streak_count === 1 ? '🌱' :
                     syncData && syncData.streak_count < 5 ? '🌿' :
                     syncData && syncData.streak_count < 10 ? '🪴' :
                     syncData && syncData.streak_count < 20 ? '🌳' : '🌺🌳🌺'}
                </Text>
                <Text style={styles.tamagotchiSub}>
                    {syncData && syncData.streak_count === 1 ? 'A new beginning! Keep the streak alive to grow.' :
                     'Thriving on your love and karma!'}
                </Text>
            </View>

            {/* Asymmetric Journal Banner */}
            {journalData && !journalData.both_answered && (
                <View style={styles.journalBanner}>
                    <Text style={styles.journalTitle}>📖 Daily Question</Text>
                    <Text style={styles.journalPrompt}>"What was the highlight of your day?"</Text>

                    {!journalData.my_answer ? (
                        <TouchableOpacity style={styles.journalBtn} onPress={() => setIsJournalModalVisible(true)}>
                            <Text style={styles.journalBtnText}>Answer to reveal their response 🔒</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.journalWaiting}>✅ You answered. Waiting for partner...</Text>
                    )}
                </View>
            )}

            {journalData && journalData.both_answered && (
                <View style={[styles.journalBanner, {backgroundColor: '#e6e6fa'}]}>
                    <Text style={styles.journalTitle}>📖 Daily Question: Revealed! ✨</Text>
                    <Text style={styles.journalPrompt}>"What was the highlight of your day?"</Text>

                    <Text style={styles.journalLabel}>You:</Text>
                    <Text style={styles.journalAnswer}>{journalData.my_answer}</Text>

                    <Text style={styles.journalLabel}>Partner:</Text>
                    <Text style={styles.journalAnswer}>{journalData.partner_answer}</Text>
                </View>
            )}

            {/* Asymmetric Journal Modal */}
            <Modal visible={isJournalModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.polaroidContainer}>
                        <Text style={styles.polaroidTitle}>Daily Question 📖</Text>
                        <Text style={{marginBottom: 10, color: '#666', fontStyle: 'italic'}}>"What was the highlight of your day?"</Text>
                        <TextInput
                            style={[styles.input, { width: '100%', height: 100, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="Your honest answer..."
                            value={journalInput}
                            onChangeText={setJournalInput}
                        />
                        <Text style={{fontSize: 10, color: '#ff4500', marginTop: 5}}>Your answer will remain hidden until they answer too.</Text>
                        <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 15}}>
                            <Button title="Cancel" color="#888" onPress={() => setIsJournalModalVisible(false)} />
                            <Button title="Submit 🔒" color="#4b0082" onPress={handleSubmitJournal} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Long Distance Countdown Banner */}
            {isLongDistanceMode && reunionDate && (
                <View style={styles.ldrBanner}>
                    <Text style={styles.ldrTitle}>Time Until We Meet ✈️</Text>
                    <Text style={styles.ldrCountdown}>
                        {Math.max(0, Math.ceil((new Date(reunionDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} Days
                    </Text>
                    {partnerTimezoneOffset && (
                        <Text style={styles.ldrClock}>
                            Partner's Time: {currentTimePartner || '--:--'}
                        </Text>
                    )}
                </View>
            )}

            {/* Dopaminergic Header / Aura Avatar */}
            {/* TouchableWithoutFeedback on the header for the "Undercover Secret Signal" */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleSecretTap}
                style={[styles.dopamineHeader, isLongDistanceMode && { backgroundColor: '#ffe4e1', borderColor: '#ff69b4', borderWidth: 2 }]}
            >
                <View style={styles.partnerAvatarContainer}>
                    <Text style={styles.partnerText}>Your Partner</Text>
                    {syncData?.partner_mood ? (
                        <AvatarWidget
                            isPartner={true}
                            partnerMood={syncData.partner_mood}
                            partnerCharacter={'owl'} // Could be fetched from user.partner if expanded
                        />
                    ) : (
                        <Text style={styles.noMoodText}>Waiting for mood...</Text>
                    )}
                    <View style={styles.karmaBadge}>
                        <Text style={styles.karmaText}>😇 Karma: {syncData?.partner_karma || 0}</Text>
                    </View>
                </View>

                <View style={styles.streakContainer}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={styles.streakText}>{syncData?.streak_count || 0} Days</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.karmaActionSection}>
                <Text style={styles.karmaSectionTitle}>Termómetro Emocional</Text>
                <View style={styles.karmaButtons}>
                    <TouchableOpacity style={styles.karmaBtn} onPress={() => setIsKarmaModalVisible(true)}>
                        <Text style={styles.karmaBtnText}>Record a favor they did 💖</Text>
                    </TouchableOpacity>
                    <Text style={styles.myKarmaText}>My Karma: {syncData?.karma_score || 0}</Text>
                </View>
            </View>

            <Modal visible={isKarmaModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.polaroidContainer}>
                        <Text style={styles.polaroidTitle}>Record a Favor 💖</Text>
                        <Text style={{marginBottom: 10, color: '#666'}}>What nice thing did they do for you?</Text>
                        <TextInput
                            style={[styles.input, { width: '100%', height: 60 }]}
                            placeholder="e.g., Brought me coffee..."
                            value={karmaInputText}
                            onChangeText={setKarmaInputText}
                        />
                        <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10}}>
                            <Button title="Cancel" color="#888" onPress={() => setIsKarmaModalVisible(false)} />
                            <Button title="Save" color="#ff69b4" onPress={handleRecordFavor} />
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Mood')}>
                    <Text style={styles.actionBtnText}>Mood</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.heartbeatBtn]} onPress={sendHapticHeartbeat}>
                    <Text style={styles.actionBtnText}>Pulse 💓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#3cb371'}]} onPress={() => navigation.navigate('StolenMoments')}>
                    <Text style={styles.actionBtnText}>Moments 📸</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.actions, { marginTop: -10 }]}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#8a2be2'}]} onPress={() => setIsCapsuleModalVisible(true)}>
                    <Text style={styles.actionBtnText}>Capsule ⏳</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#ff8c00'}]} onPress={() => navigation.navigate('FirstTimes')}>
                    <Text style={styles.actionBtnText}>Firsts 🌟</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#20b2aa'}]} onPress={generateRandomPlan}>
                    <Text style={styles.actionBtnText}>Plan 🎲</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.actions, { marginTop: -10 }]}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2b2b2b'}]} onPress={() => setIsMovieModeActive(true)}>
                    <Text style={styles.actionBtnText}>Movie Mode 🍿</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: isLongDistanceMode ? '#ff4500' : '#888'}]} onPress={() => setIsReunionModalVisible(true)}>
                    <Text style={styles.actionBtnText}>{isLongDistanceMode ? 'LDR Active ✈️' : 'LDR Mode ✈️'}</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={isReunionModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.polaroidContainer}>
                        <Text style={styles.polaroidTitle}>Long Distance Mode ✈️</Text>
                        <Text style={{marginBottom: 10, color: '#666', textAlign: 'center'}}>When are you meeting next? (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[styles.input, { width: '100%' }]}
                            placeholder="e.g., 2024-12-25"
                            value={reunionInput}
                            onChangeText={setReunionInput}
                        />
                        <Text style={{marginTop: 10, marginBottom: 10, color: '#666', textAlign: 'center'}}>Partner Timezone (UTC Offset):</Text>
                        <TextInput
                            style={[styles.input, { width: '100%' }]}
                            placeholder="e.g., -5, 2, 5.5"
                            keyboardType="numeric"
                            value={timezoneInput}
                            onChangeText={setTimezoneInput}
                        />
                        <Text style={{fontSize: 12, color: '#888', marginBottom: 10}}>Leave date blank to disable LDR mode.</Text>
                        <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10}}>
                            <Button title="Cancel" color="#888" onPress={() => setIsReunionModalVisible(false)} />
                            <Button title="Save" color="#ff4500" onPress={setLongDistanceDate} />
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Latest Entry</Text>
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

    // Dopaminergic Styles
    dopamineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0f4f8',
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    partnerAvatarContainer: {
        alignItems: 'center',
    },
    partnerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 10,
    },
    noMoodText: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 5,
    },
    karmaBadge: {
        marginTop: 5,
        backgroundColor: '#e6e6fa',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    karmaText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4b0082',
    },
    karmaActionSection: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        elevation: 2,
    },
    karmaSectionTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    karmaButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    karmaBtn: {
        backgroundColor: '#ff69b4',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    karmaBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    myKarmaText: {
        fontWeight: 'bold',
        color: '#555',
    },
    sparkBanner: {
        backgroundColor: '#ffd700',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        alignItems: 'center',
    },
    conflictBanner: {
        backgroundColor: '#e0f7fa',
        borderColor: '#b2ebf2',
        borderWidth: 1,
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
    },
    conflictText: {
        color: '#006064',
        textAlign: 'center',
        fontStyle: 'italic',
        fontWeight: '500',
    },
    ldrBanner: {
        backgroundColor: '#ff4500',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 4,
    },
    ldrTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    ldrCountdown: {
        color: 'white',
        fontSize: 36,
        fontWeight: '900',
        marginTop: 5,
    },
    ldrClock: {
        color: 'white',
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 10,
    },
    tamagotchiContainer: {
        backgroundColor: '#e8f5e9',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
    },
    tamagotchiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 10,
    },
    tamagotchiEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    tamagotchiSub: {
        fontSize: 12,
        color: '#4caf50',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    journalBanner: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        elevation: 2,
    },
    journalTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#4b0082',
        marginBottom: 5,
    },
    journalPrompt: {
        fontStyle: 'italic',
        color: '#333',
        marginBottom: 10,
    },
    journalBtn: {
        backgroundColor: '#4b0082',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    journalBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    journalWaiting: {
        color: '#2e8b57',
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    journalLabel: {
        fontWeight: 'bold',
        marginTop: 10,
        color: '#555',
    },
    journalAnswer: {
        color: '#333',
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderColor: '#ccc',
        marginTop: 5,
    },
    sparkText: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    sparkButton: {
        backgroundColor: '#ff4500',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginVertical: 5,
    },
    sparkButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    actionBtn: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 10,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    heartbeatBtn: {
        backgroundColor: '#ff1493',
    },
    actionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    streakContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    polaroidContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        width: '100%',
        elevation: 10,
    },
    polaroidTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    polaroidImage: {
        width: 300,
        height: 300,
        resizeMode: 'cover',
        borderRadius: 10,
        backgroundColor: '#eee',
        marginBottom: 15,
    },
    polaroidDesc: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
    },
    polaroidCloseBtn: {
        backgroundColor: '#ff4500',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    polaroidCloseText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    streakEmoji: {
        fontSize: 32,
    },
    streakText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ff4500',
        marginTop: 4,
    },
});
