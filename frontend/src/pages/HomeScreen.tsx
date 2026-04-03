import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, RefreshControl, TextInput, Alert, TouchableOpacity, Modal, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DailyEntry } from '../types';
import { syncManager, SyncResponse } from '../services/syncManager';
import AvatarWidget from '../components/AvatarWidget';
import LDRClock from '../components/LDRClock';
import TimeCapsuleModal from '../components/modals/TimeCapsuleModal';
import KarmaModal from '../components/modals/KarmaModal';
import RandomPlanModal from '../components/modals/RandomPlanModal';
import PolaroidModal from '../components/modals/PolaroidModal';
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

    // Feature 4: Shake to Connect (Optimized Listener)
    useFocusEffect(
        useCallback(() => {
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

            // Clean up the subscription when the screen loses focus
            return () => {
                subscription.remove();
            };
        }, [])
    );


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

    const handleSendTimeCapsule = useCallback(async () => {
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
    }, [capsuleInputText]);

    const closePolaroid = async () => {
        if (activePolaroid) {
            // Consume the spark so it disappears forever (Snapchat style)
            await syncManager.consumeSpark(activePolaroid.id);
            // Remove from local UI state
            setIncomingSparks(prev => prev.filter(s => s.id !== activePolaroid.id));
            setActivePolaroid(null);
        }
    };

    const generateRandomPlan = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * plansData.length);
        setRandomPlan(plansData[randomIndex]);
    }, []);

    const handleRecordFavor = useCallback(async () => {
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
    }, [karmaInputText]);

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
            <TimeCapsuleModal
                visible={isCapsuleModalVisible}
                inputText={capsuleInputText}
                setInputText={setCapsuleInputText}
                onClose={useCallback(() => setIsCapsuleModalVisible(false), [])}
                onSend={handleSendTimeCapsule}
            />

            <RandomPlanModal
                plan={randomPlan}
                onReroll={generateRandomPlan}
                onClose={useCallback(() => setRandomPlan(null), [])}
            />

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

            <PolaroidModal
                polaroidSpark={activePolaroid}
                onClose={closePolaroid}
            />

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
                        <LDRClock partnerTimezoneOffset={partnerTimezoneOffset} />
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
                <Text style={styles.myKarmaText}>My Karma: {syncData?.karma_score || 0}</Text>
                <TouchableOpacity style={styles.karmaBtn} onPress={() => setIsKarmaModalVisible(true)}>
                    <Text style={styles.karmaBtnText}>Record a favor 💖</Text>
                </TouchableOpacity>
            </View>

            <KarmaModal
                visible={isKarmaModalVisible}
                inputText={karmaInputText}
                setInputText={setKarmaInputText}
                onClose={useCallback(() => setIsKarmaModalVisible(false), [])}
                onSave={handleRecordFavor}
            />

            {/* Minimal Action Grid */}
            <View style={styles.actionsGrid}>
                {/* Primary Action */}
                <TouchableOpacity style={[styles.actionCard, styles.pulseCard]} onPress={sendHapticHeartbeat}>
                    <Text style={styles.actionCardIcon}>💓</Text>
                    <Text style={[styles.actionCardText, styles.pulseText]}>Send Pulse</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Mood')}>
                    <Text style={styles.actionCardIcon}>🎭</Text>
                    <Text style={styles.actionCardText}>Update Mood</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('StolenMoments')}>
                    <Text style={styles.actionCardIcon}>📸</Text>
                    <Text style={styles.actionCardText}>Moments</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => setIsCapsuleModalVisible(true)}>
                    <Text style={styles.actionCardIcon}>⏳</Text>
                    <Text style={styles.actionCardText}>Time Capsule</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('FirstTimes')}>
                    <Text style={styles.actionCardIcon}>🌟</Text>
                    <Text style={styles.actionCardText}>First Times</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={generateRandomPlan}>
                    <Text style={styles.actionCardIcon}>🎲</Text>
                    <Text style={styles.actionCardText}>Random Plan</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => setIsMovieModeActive(true)}>
                    <Text style={styles.actionCardIcon}>🍿</Text>
                    <Text style={styles.actionCardText}>Movie Mode</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, isLongDistanceMode && { borderColor: COLORS.accentCalm, borderWidth: 2 }]} onPress={() => setIsReunionModalVisible(true)}>
                    <Text style={styles.actionCardIcon}>✈️</Text>
                    <Text style={styles.actionCardText}>{isLongDistanceMode ? 'LDR Active' : 'LDR Mode'}</Text>
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

const COLORS = {
    background: '#FAF9F6', // Cozy off-white
    surface: '#FFFFFF', // Pure white for cards
    textPrimary: '#2C3E50', // Slate blue/gray
    textSecondary: '#7F8C8D', // Soft gray
    accentWarm: '#E27D60', // Terracotta/warm peach (for buttons, sparks)
    accentNature: '#85AC8A', // Sage green (for plant, positive feedback)
    accentCalm: '#C0D6DF', // Soft blue/gray (for LDR, neutral banners)
    border: '#EEEEEE',
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: COLORS.background },
    scrollContainer: { padding: 24, backgroundColor: COLORS.background, flexGrow: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
    title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: COLORS.textSecondary },
    card: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    input: { borderWidth: 1, borderColor: COLORS.border, padding: 12, marginVertical: 10, borderRadius: 12, backgroundColor: '#FAFAFA', color: COLORS.textPrimary },

    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: COLORS.textPrimary, letterSpacing: -0.3 },

    // Dopaminergic Header
    dopamineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 24,
        borderRadius: 24,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
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
        marginTop: 10,
        backgroundColor: `${COLORS.accentWarm}15`, // 15% opacity hex
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    karmaText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.accentWarm,
    },

    // Streak Container
    streakContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakEmoji: {
        fontSize: 36,
    },
    streakText: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.accentWarm,
        marginTop: 6,
    },

    // Karma inline section
    karmaActionSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    karmaBtn: {
        backgroundColor: `${COLORS.accentWarm}15`,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    karmaBtnText: {
        color: COLORS.accentWarm,
        fontWeight: '700',
    },
    myKarmaText: {
        fontWeight: '600',
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    // Cozy Banners
    sparkBanner: {
        backgroundColor: `${COLORS.accentWarm}10`,
        borderColor: `${COLORS.accentWarm}30`,
        borderWidth: 1,
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
        alignItems: 'center',
    },
    sparkText: {
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 15,
        fontSize: 16,
    },
    sparkButton: {
        backgroundColor: COLORS.surface,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginVertical: 6,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sparkButtonText: {
        color: COLORS.accentWarm,
        fontWeight: '700',
        fontSize: 15,
    },

    conflictBanner: {
        backgroundColor: `${COLORS.accentCalm}20`,
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: `${COLORS.accentCalm}50`,
    },
    conflictText: {
        color: '#5D6D7E',
        textAlign: 'center',
        lineHeight: 22,
        fontSize: 15,
    },

    ldrBanner: {
        backgroundColor: COLORS.accentCalm,
        padding: 24,
        borderRadius: 24,
        marginBottom: 30,
        alignItems: 'center',
        shadowColor: COLORS.textPrimary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    ldrTitle: {
        color: COLORS.textPrimary,
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    ldrCountdown: {
        color: COLORS.textPrimary,
        fontSize: 48,
        fontWeight: '800',
        marginTop: 5,
        letterSpacing: -2,
    },

    // Modal common styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    polaroidContainer: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    polaroidTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 15,
        color: COLORS.textPrimary,
    },
    polaroidDesc: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginBottom: 20,
    },
    polaroidCloseBtn: {
        backgroundColor: COLORS.accentWarm,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        marginTop: 10,
    },
    polaroidCloseText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },

    // Tamagotchi
    tamagotchiContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingVertical: 10,
    },
    tamagotchiTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 10,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tamagotchiEmoji: {
        fontSize: 70,
        marginBottom: 15,
    },
    tamagotchiSub: {
        fontSize: 14,
        color: COLORS.accentNature,
        fontStyle: 'italic',
        textAlign: 'center',
    },

    // Asymmetric Journal
    journalBanner: {
        backgroundColor: COLORS.surface,
        padding: 24,
        borderRadius: 24,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    journalTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: COLORS.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    journalPrompt: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 20,
        lineHeight: 24,
    },
    journalBtn: {
        backgroundColor: COLORS.accentNature,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    journalBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    journalWaiting: {
        color: COLORS.accentNature,
        fontWeight: '600',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
    },
    journalLabel: {
        fontWeight: '700',
        marginTop: 15,
        color: COLORS.textSecondary,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    journalAnswer: {
        color: COLORS.textPrimary,
        fontSize: 16,
        lineHeight: 24,
        paddingLeft: 12,
        borderLeftWidth: 3,
        borderColor: `${COLORS.accentNature}50`,
        marginTop: 8,
    },

    // Minimal Action Grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    actionCard: {
        backgroundColor: COLORS.surface,
        width: '48%', // Two columns
        paddingVertical: 20,
        borderRadius: 20,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    actionCardIcon: {
        fontSize: 28,
        marginBottom: 10,
    },
    actionCardText: {
        color: COLORS.textPrimary,
        fontWeight: '600',
        fontSize: 14,
    },
    pulseCard: {
        backgroundColor: COLORS.accentWarm,
        borderColor: COLORS.accentWarm,
    },
    pulseText: {
        color: 'white',
    },
});
