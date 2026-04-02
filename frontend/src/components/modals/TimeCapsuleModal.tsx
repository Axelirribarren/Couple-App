import React, { memo } from 'react';
import { View, Text, Button, StyleSheet, Modal, TextInput } from 'react-native';

interface TimeCapsuleModalProps {
    visible: boolean;
    inputText: string;
    setInputText: (text: string) => void;
    onClose: () => void;
    onSend: () => void;
}

const TimeCapsuleModal = memo(({ visible, inputText, setInputText, onClose, onSend }: TimeCapsuleModalProps) => {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.polaroidContainer}>
                    <Text style={styles.polaroidTitle}>Time Capsule ⏳</Text>
                    <Text style={{marginBottom: 10, color: '#666'}}>Write a message for your partner. It will unlock tomorrow.</Text>
                    <TextInput
                        style={[styles.input, { width: '100%', height: 100, textAlignVertical: 'top' }]}
                        multiline
                        placeholder="I hope you're having a great day..."
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10}}>
                        <Button title="Cancel" color="#888" onPress={onClose} />
                        <Button title="Send" color="#8a2be2" onPress={onSend} />
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

export default TimeCapsuleModal;
