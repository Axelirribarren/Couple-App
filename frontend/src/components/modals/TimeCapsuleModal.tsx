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
                    <Text style={{marginBottom: 20, color: '#7F8C8D', textAlign: 'center'}}>Write a message for your partner. It will unlock tomorrow.</Text>
                    <TextInput
                        style={[styles.input, { width: '100%', height: 100, textAlignVertical: 'top' }]}
                        multiline
                        placeholder="I hope you're having a great day..."
                        placeholderTextColor="#BDC3C7"
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10}}>
                        <View style={{flex: 1, marginHorizontal: 5}}>
                            <Button title="Cancel" color="#7F8C8D" onPress={onClose} />
                        </View>
                        <View style={{flex: 1, marginHorizontal: 5}}>
                            <Button title="Send" color="#E27D60" onPress={onSend} />
                        </View>
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
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#EEEEEE',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
        color: '#2C3E50',
    },
});

export default TimeCapsuleModal;
