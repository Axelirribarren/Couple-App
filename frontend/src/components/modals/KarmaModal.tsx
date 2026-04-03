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
                    <Text style={{marginBottom: 20, color: '#7F8C8D', textAlign: 'center'}}>What nice thing did they do for you?</Text>
                    <TextInput
                        style={[styles.input, { width: '100%', height: 60 }]}
                        placeholder="e.g., Brought me coffee..."
                        placeholderTextColor="#BDC3C7"
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 15}}>
                        <View style={{flex: 1, marginHorizontal: 5}}>
                            <Button title="Cancel" color="#7F8C8D" onPress={onClose} />
                        </View>
                        <View style={{flex: 1, marginHorizontal: 5}}>
                            <Button title="Save" color="#E27D60" onPress={onSave} />
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

export default KarmaModal;
