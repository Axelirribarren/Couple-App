import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MotiView } from 'moti';

// Map images manually or dynamically
const getAvatarImage = (character: string, mood: number) => {
    // This requires require() to be static usually, but dynamic require works in RN if paths are known. 
    // However, it's safer to have a map.
    
    // Constructing a map of all possibilities
    if (character === 'owl') {
        switch(mood) {
            case 1: return require('../img/owl/owl-1.png');
            case 2: return require('../img/owl/owl-2.png');
            case 3: return require('../img/owl/owl-3.png');
            case 4: return require('../img/owl/owl-4.png');
            case 5: return require('../img/owl/owl-5.png');
            default: return require('../img/owl/owl-3.png');
        }
    } else {
        // Alien
        switch(mood) {
            case 1: return require('../img/alien/alien-1.png');
            case 2: return require('../img/alien/alien-2.png');
            case 3: return require('../img/alien/alien-3.png');
            case 4: return require('../img/alien/alien-4.png');
            case 5: return require('../img/alien/alien-5.png');
            default: return require('../img/alien/alien-3.png');
        }
    }
};

export default function AvatarWidget({ isPartner = false, partnerMood = 3, partnerCharacter = 'owl' }: { isPartner?: boolean, partnerMood?: number, partnerCharacter?: string }) {
    const { user } = useAuth();

    if (!user && !isPartner) return null;

    const characterToUse = isPartner ? partnerCharacter : (user?.character || 'owl');
    const moodToUse = isPartner ? partnerMood : (user?.current_mood || 3);

    const imageSource = getAvatarImage(characterToUse, moodToUse);

    // Dynamic aura based on mood (1 = sad/cold, 5 = ecstatic/warm)
    const getAuraColor = (mood: number) => {
        switch (mood) {
            case 1: return 'rgba(100, 149, 237, 0.4)'; // Cold blue
            case 2: return 'rgba(135, 206, 235, 0.3)'; // Light blue
            case 3: return 'rgba(211, 211, 211, 0.2)'; // Neutral grey
            case 4: return 'rgba(255, 165, 0, 0.4)'; // Warm orange
            case 5: return 'rgba(255, 69, 0, 0.6)'; // Hot red/orange
            default: return 'transparent';
        }
    };

    const auraColor = getAuraColor(moodToUse);

    // If it's the partner, we render an aura
    return (
        <View style={styles.container}>
            {isPartner ? (
                <MotiView
                    from={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    transition={{
                        loop: true,
                        type: 'timing',
                        duration: 1500,
                    }}
                    style={[styles.aura, { backgroundColor: auraColor }]}
                />
            ) : null}
            <Image source={imageSource} style={styles.image} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    image: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        zIndex: 2,
    },
    aura: {
        position: 'absolute',
        width: 45,
        height: 45,
        borderRadius: 25,
        zIndex: 1,
    }
});
