import React, { memo } from 'react';
import { View, Text, Button, StyleSheet, Modal } from 'react-native';

interface RandomPlanModalProps {
    plan: string | null;
    onReroll: () => void;
    onClose: () => void;
}

const RandomPlanModal = memo(({ plan, onReroll, onClose }: RandomPlanModalProps) => {
    return (
        <Modal visible={!!plan} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.polaroidContainer}>
                    <Text style={styles.polaroidTitle}>Random Plan 🎲</Text>
                    <Text style={[styles.polaroidDesc, { fontSize: 18, color: '#333', marginVertical: 20 }]}>{plan}</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                        <Button title="Reroll 🎲" color="#888" onPress={onReroll} />
                        <Button title="Awesome!" color="#3cb371" onPress={onClose} />
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
    polaroidDesc: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
    }
});

export default RandomPlanModal;
