import React, { memo } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity } from 'react-native';

interface PolaroidModalProps {
    polaroidSpark: any | null;
    onClose: () => void;
}

const PolaroidModal = memo(({ polaroidSpark, onClose }: PolaroidModalProps) => {
    return (
        <Modal
            visible={!!polaroidSpark}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.polaroidContainer}>
                    <Text style={styles.polaroidTitle}>Mystery Polaroid 📸</Text>
                    <Image
                        source={{ uri: `data:image/jpeg;base64,${polaroidSpark?.encrypted_payload}` }}
                        style={styles.polaroidImage}
                    />
                    <Text style={styles.polaroidDesc}>Your partner sent you a snapshot of their day. It will disappear after you close this!</Text>
                    <TouchableOpacity style={styles.polaroidCloseBtn} onPress={onClose}>
                        <Text style={styles.polaroidCloseText}>Close and delete forever</Text>
                    </TouchableOpacity>
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
});

export default PolaroidModal;
