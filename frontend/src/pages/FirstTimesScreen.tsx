import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, TextInput, Modal, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

// Ignore the strict TS typing for FileSystem module exports (known Expo quirk)
// @ts-ignore
const FIRST_TIMES_FILE = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}first_times.json`;

interface FirstTimeEntry {
    id: string;
    title: string;
    note: string;
    timestamp: number;
    locationStr: string | null;
}

export default function FirstTimesScreen() {
    const [entries, setEntries] = useState<FirstTimeEntry[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(FIRST_TIMES_FILE);
            if (fileInfo.exists) {
                const contents = await FileSystem.readAsStringAsync(FIRST_TIMES_FILE);
                const data = JSON.parse(contents);
                setEntries(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
            }
        } catch (e) {
            console.error("Failed to load first times", e);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please provide a title.");
            return;
        }

        setIsSaving(true);
        let locationStr = null;

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                locationStr = `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
            }
        } catch (e) {
            console.log("Could not fetch location", e);
        }

        const newEntry: FirstTimeEntry = {
            id: Date.now().toString(),
            title,
            note,
            timestamp: Date.now(),
            locationStr
        };

        try {
            const newEntries = [newEntry, ...entries];
            await FileSystem.writeAsStringAsync(FIRST_TIMES_FILE, JSON.stringify(newEntries));

            setEntries(newEntries);
            setIsModalVisible(false);
            setTitle('');
            setNote('');
        } catch (e) {
            Alert.alert("Error", "Failed to save entry.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderItem = ({ item }: { item: FirstTimeEntry }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>✨ {item.title}</Text>
                <Text style={styles.cardDate}>{new Date(item.timestamp).toLocaleDateString()}</Text>
            </View>
            {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
            {item.locationStr && (
                <Text style={styles.cardLocation}>📍 {item.locationStr}</Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No "First Times" recorded yet. Add your first memory together! 🌟</Text>}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            />

            <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Record a First Time 🌟</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="e.g., First trip to the beach..."
                            value={title}
                            onChangeText={setTitle}
                        />

                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Add a note or memory..."
                            multiline
                            value={note}
                            onChangeText={setNote}
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: '#888' }]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: '#ff8c00' }]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                <Text style={styles.btnText}>{isSaving ? 'Saving...' : 'Save Memory'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ff4500',
        flex: 1,
    },
    cardDate: {
        fontSize: 12,
        color: '#888',
        marginLeft: 10,
    },
    cardNote: {
        color: '#444',
        marginBottom: 10,
        lineHeight: 20,
    },
    cardLocation: {
        fontSize: 12,
        color: '#0066cc',
        fontStyle: 'italic',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#888',
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#ff8c00',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    fabIcon: {
        fontSize: 30,
        color: 'white',
        lineHeight: 32,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    btn: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
    }
});