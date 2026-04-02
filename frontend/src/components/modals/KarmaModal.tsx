import React, { memo } from 'react';
import { View, Text, Button, StyleSheet, Modal, TextInput } from 'react-native';

interface KarmaModalProps {
    visible: boolean;
    inputText: string;
    setInputText: (text: string) => void;
    onClose: () => void;
    onSave: () => void;
}

const KarmaModal = memo(({ visible, inputText, setInputText, onClose, onSave }: KarmaModalProps) => {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.polaroidContainer}>
                    <Text style={styles.polaroidTitle}>Record a Favor 💖</Text>
                    <Text style={{marginBottom: 10, color: '#666'}}>What nice thing did they do for you?</Text>
                    <TextInput
                        style={[styles.input, { width: '100%', height: 60 }]}
                        placeholder="e.g., Brought me coffee..."
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10}}>
                        <Button title="Cancel" color="#888" onPress={onClose} />
                        <Button title="Save" color="#ff69b4" onPress={onSave} />
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
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
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
    },
});

export default KarmaModal;
