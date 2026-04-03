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
                    <Text style={[styles.polaroidDesc, { fontSize: 18, color: '#2C3E50', marginVertical: 20, fontWeight: '600' }]}>{plan}</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10}}>
                        <View style={{flex: 1, marginHorizontal: 5}}>
                            <Button title="Reroll" color="#7F8C8D" onPress={onReroll} />
                        </View>
                        <View style={{flex: 1, marginHorizontal: 5}}>
                            <Button title="Awesome!" color="#85AC8A" onPress={onClose} />
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
    polaroidDesc: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
    }
});

export default RandomPlanModal;
