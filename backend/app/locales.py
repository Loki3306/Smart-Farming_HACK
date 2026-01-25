
# Backend Localization Strings
# Used for generating dynamic recommendation text in the requested language

LOCALE_STRINGS = {
    "en": {
        "config_error_title": "Crop Configuration Required",
        "config_error_desc": "Crop type not specified. Please configure your crop in Farm settings.",
        "config_error_action": "Go to Farm Settings and configure your crop type before getting personalized recommendations.",
        
        "crop_info_title": "Growing {crop_type}",
        "crop_info_desc": "Crop '{crop_type}' is valid but not in our optimized list. Using general recommendations.",
        "crop_info_action": "Recommendations will be based on general agricultural best practices. Consider consulting with local agricultural experts for crop-specific guidance.",
        
        "nitrogen_low_title": "Nitrogen Deficiency Detected",
        "nitrogen_low_desc": "Soil nitrogen is critically low ({value:.1f} mg/kg). Immediate action needed for plant growth.",
        "nitrogen_low_action": "Apply {bags:.1f} bags ({amount_per_acre:.1f} kg) of urea per acre within 7 days.",
        
        "nitrogen_optimal_title": "Nitrogen Levels Optimal",
        "nitrogen_optimal_desc": "Nitrogen content is sufficient ({value:.1f} mg/kg). No immediate action needed.",
        "nitrogen_optimal_action": "Continue monitoring. Retest in 14 days.",
        
        "phosphorus_low_title": "Phosphorus Deficiency",
        "phosphorus_low_desc": "Phosphorus is below optimal level ({value:.1f} mg/kg). Important for root development.",
        "phosphorus_low_action": "Apply {bags:.1f} bags ({amount_per_acre:.1f} kg) of phosphate fertilizer (DAP or SSP) per acre.",
        
        "phosphorus_moderate_title": "Phosphorus Levels Moderate",
        "phosphorus_moderate_desc": "Phosphorus ({value:.1f} mg/kg) is adequate but could be improved for better root development.",
        "phosphorus_moderate_action": "Consider applying light phosphate top-dressing during next fertilization cycle.",
        
        "potassium_low_title": "Potassium Deficiency",
        "potassium_low_desc": "Potassium level is low ({value:.1f} mg/kg). Essential for disease resistance.",
        "potassium_low_action": "Apply {bags:.1f} bags ({amount_per_acre:.1f} kg) of potassium chloride (MOP) per acre.",
        
        "potassium_optimal_title": "Potassium Levels Optimal",
        "potassium_optimal_desc": "Potassium content ({value:.1f} mg/kg) is within ideal range for healthy crop development.",
        "potassium_optimal_action": "Continue monitoring. Maintain current fertilization schedule.",
        
        "irrigation_needed_title": "Irrigation Needed for {crop_type}",
        "irrigation_needed_desc": "Soil moisture is low ({value:.1f}%) for {crop_type}. Optimal range is {min}-{max}%.",
        "irrigation_needed_action": "Run water pump for ~{hours:.1f} hours ({inches:.1f} inch depth). Check moisture after.",
        "irrigation_rice_action": "Maintain ankle-deep standing water (~2-3 inches).",
        
        "irrigation_reduce_title": "Reduce Irrigation",
        "irrigation_reduce_desc": "Soil moisture is high ({value:.1f}%). Risk of waterlogging.",
        "irrigation_reduce_action": "Pause irrigation for next {days} days. Check drainage system.",
        
        "irrigation_optimal_title": "Irrigation Levels Optimal",
        "irrigation_optimal_desc": "Soil moisture is in optimal range ({value:.1f}%).",
        "irrigation_optimal_action": "Maintain current irrigation schedule. Monitor daily.",
        
        "heat_stress_title": "Heat Stress Alert",
        "heat_stress_desc": "Temperature is {value:.1f}°C, exceeding optimal range. Risk of stress.",
        "heat_stress_action": "Increase irrigation frequency. Apply mulch to reduce soil temperature.",
        
        "ph_acidic_title": "Soil Too Acidic",
        "ph_acidic_desc": "pH {value:.1f} is too acidic. Acidic soil reduces nutrient availability.",
        "ph_acidic_action": "Apply agricultural lime (CaCO3) at 2-3 tons/hectare.",
        
        "ph_alkaline_title": "Soil Too Alkaline",
        "ph_alkaline_desc": "pH {value:.1f} is too alkaline. Limits micronutrient availability.",
        "ph_alkaline_action": "Apply elemental sulfur or gypsum.",
        
        "ph_optimal_title": "Soil pH Optimal",
        "ph_optimal_desc": "Soil pH ({value:.1f}) is within ideal range.",
        "ph_optimal_action": "Continue monitoring pH levels monthly.",
        
        "humidity_high_title": "High Humidity Alert",
        "humidity_high_desc": "Air humidity ({value:.0f}%) is elevated. Risk of fungal diseases.",
        "humidity_high_action": "Monitor for fungal infection. Improve air circulation.",
        
        "rain_warning_title": "Rain Expected - Stop Irrigation",
        "rain_warning_desc": "Weather forecast shows rain coming. Avoid over-watering.",
        "rain_warning_action": "Pause irrigation until after rainfall.",
        
        "salinity_high_title": "Soil Salinity Elevated",
        "salinity_high_desc": "EC ({value:.2f} dS/m) indicates elevated salinity.",
        "salinity_high_action": "Apply gypsum treatment. Improve drainage.",
        
        "salinity_normal_title": "Soil Salinity Normal",
        "salinity_normal_desc": "EC ({value:.2f} dS/m) is within acceptable range.",
        "salinity_normal_action": "Continue monitoring EC levels periodically."
    },
    
    "hi": {
        "config_error_title": "फसल विन्यास आवश्यक",
        "config_error_desc": "फसल का प्रकार निर्दिष्ट नहीं है। कृपया फार्म सेटिंग्स में अपनी फसल कॉन्फ़िगर करें।",
        "config_error_action": "सिफारिशें प्राप्त करने से पहले फार्म सेटिंग्स में जाएं और फसल का प्रकार सेट करें।",
        
        "crop_info_title": "{crop_type} की खेती",
        "crop_info_desc": "फसल '{crop_type}' मान्य है लेकिन हमारी सूची में नहीं है। सामान्य सिफारिशें दी जा रही हैं।",
        "crop_info_action": "सिफारिशें सामान्य कृषि पद्धतियों पर आधारित होंगी। विशेषज्ञ सलाह लें।",
        
        "nitrogen_low_title": "नाइट्रोजन की कमी पाई गई",
        "nitrogen_low_desc": "मिट्टी में नाइट्रोजन बहुत कम है ({value:.1f} mg/kg)। पौधों की वृद्धि के लिए तत्काल कार्रवाई आवश्यक है।",
        "nitrogen_low_action": "७ दिनों के भीतर प्रति एकड़ {bags:.1f} बोरी ({amount_per_acre:.1f} kg) यूरिया खाद डालें।",
        
        "nitrogen_optimal_title": "नाइट्रोजन स्तर इष्टतम",
        "nitrogen_optimal_desc": "नाइट्रोजन की मात्रा पर्याप्त है ({value:.1f} mg/kg)। कोई तत्काल कार्रवाई आवश्यक नहीं है।",
        "nitrogen_optimal_action": "निगरानी जारी रखें। 14 दिनों में पुनः परीक्षण करें।",
        
        "phosphorus_low_title": "फॉस्फोरस की कमी",
        "phosphorus_low_desc": "फॉस्फोरस इष्टतम स्तर से कम है ({value:.1f} mg/kg)। जड़ों के विकास के लिए महत्वपूर्ण।",
        "phosphorus_low_action": "प्रति एकड़ {bags:.1f} बोरी ({amount_per_acre:.1f} kg) फॉस्फेट खाद (DAP या SSP) डालें।",
        
        "phosphorus_moderate_title": "फॉस्फोरस स्तर मध्यम",
        "phosphorus_moderate_desc": "फॉस्फोरस ({value:.1f} mg/kg) पर्याप्त है लेकिन बेहतर जड़ विकास के लिए सुधारा जा सकता है।",
        "phosphorus_moderate_action": "अगले निषेचन चक्र के दौरान हल्के फॉस्फेट टॉप-ड्रेसिंग पर विचार करें।",
        
        "potassium_low_title": "पोटेशियम की कमी",
        "potassium_low_desc": "पोटेशियम का स्तर कम है ({value:.1f} mg/kg)। रोग प्रतिरोध के लिए आवश्यक।",
        "potassium_low_action": "प्रति एकड़ {bags:.1f} बोरी ({amount_per_acre:.1f} kg) पोटाश (MOP) डालें।",
        
        "potassium_optimal_title": "पोटेशियम स्तर इष्टतम",
        "potassium_optimal_desc": "स्वस्थ फसल विकास के लिए पोटेशियम सामग्री ({value:.1f} mg/kg) आदर्श सीमा के भीतर है।",
        "potassium_optimal_action": "निगरानी जारी रखें। वर्तमान निषेचन कार्यक्रम बनाए रखें।",
        
        "irrigation_needed_title": "{crop_type} के लिए सिंचाई आवश्यक",
        "irrigation_needed_desc": "{crop_type} के लिए मिट्टी की नमी कम है ({value:.1f}%)। इष्टतम सीमा {min}-{max}% है।",
        "irrigation_needed_action": "~{hours:.1f} घंटे के लिए पानी का पंप चलाएं। ({inches:.1f} इंच पानी)।",
        "irrigation_rice_action": "खेत में घुटने तक (२-३ इंच) पानी भरा रखें।",
        
        "irrigation_reduce_title": "सिंचाई कम करें",
        "irrigation_reduce_desc": "मिट्टी की नमी अधिक है ({value:.1f}%)। जलभराव का खतरा।",
        "irrigation_reduce_action": "अगले {days} दिनों के लिए सिंचाई रोक दें। जल निकासी प्रणाली की जाँच करें।",
        
        "irrigation_optimal_title": "सिंचाई स्तर इष्टतम",
        "irrigation_optimal_desc": "मिट्टी की नमी इष्टतम सीमा ({value:.1f}%) में है।",
        "irrigation_optimal_action": "वर्तमान सिंचाई कार्यक्रम बनाए रखें। प्रतिदिन निगरानी करें।",
        
        "heat_stress_title": "गर्मी तनाव चेतावनी",
        "heat_stress_desc": "तापमान {value:.1f}°C है, जो इष्टतम सीमा से अधिक है। तनाव का खतरा।",
        "heat_stress_action": "सिंचाई की आवृत्ति बढ़ाएं। तापमान कम करने के लिए मल्चिंग करें।",
        
        "ph_acidic_title": "मिट्टी बहुत अम्लीय है",
        "ph_acidic_desc": "pH {value:.1f} बहुत अम्लीय है। अम्लीय मिट्टी पोषक तत्वों की उपलब्धता कम कर देती है।",
        "ph_acidic_action": "कृषि चूना (CaCO3) 2-3 टन/हेक्टेयर डालें।",
        
        "ph_alkaline_title": "मिट्टी बहुत क्षारीय है",
        "ph_alkaline_desc": "pH {value:.1f} बहुत क्षारीय है। सूक्ष्म पोषक तत्वों की उपलब्धता को सीमित करता है।",
        "ph_alkaline_action": "सल्फर या जिप्सम का प्रयोग करें।",
        
        "ph_optimal_title": "मिट्टी का pH इष्टतम",
        "ph_optimal_desc": "मिट्टी का pH ({value:.1f}) आदर्श सीमा के भीतर है।",
        "ph_optimal_action": "मासिक pH स्तर की निगरानी जारी रखें।",
        
        "humidity_high_title": "उच्च आर्द्रता चेतावनी",
        "humidity_high_desc": "हवा में नमी ({value:.0f}%) अधिक है। कवक रोगों का खतरा।",
        "humidity_high_action": "फंगल संक्रमण के लिए निगरानी करें। वायु संचार में सुधार करें।",
        
        "rain_warning_title": "बारिश की उम्मीद - सिंचाई रोकें",
        "rain_warning_desc": "मौसम पूर्वानुमान में बारिश दिखा रहा है। अधिक पानी देने से बचें।",
        "rain_warning_action": "बारिश के बाद तक सिंचाई रोक दें।",
        
        "salinity_high_title": "मिट्टी की लवणता अधिक",
        "salinity_high_desc": "EC ({value:.2f} dS/m) उच्च लवणता इंगित करता है।",
        "salinity_high_action": "जिप्सम उपचार लागू करें। जल निकासी में सुधार करें।",
        
        "salinity_normal_title": "मिट्टी की लवणता सामान्य",
        "salinity_normal_desc": "EC ({value:.2f} dS/m) स्वीकार्य सीमा के भीतर है।",
        "salinity_normal_action": "समय-समय पर EC स्तरों की निगरानी जारी रखें।"
    },
    
    "mr": {
        "config_error_title": "पीक कॉन्फिगरेशन आवश्यक",
        "config_error_desc": "पिकाचा प्रकार नमूद केलेला नाही. कृपया फार्म सेटिंग्जमध्ये तुमचे पीक कॉन्फिगर करा.",
        "config_error_action": "शिफारसी मिळवण्यापूर्वी फार्म सेटिंग्जमध्ये जा आणि पिकाचा प्रकार सेट करा.",
        
        "crop_info_title": "{crop_type} लागवड",
        "crop_info_desc": "पीक '{crop_type}' वैध आहे परंतु आमच्या ऑप्टिमाइझ सूचीमध्ये नाही. सामान्य शिफारसी वापरल्या जात आहेत.",
        "crop_info_action": "शिफारसी सामान्य कृषी पद्धतींवर आधारित असतील. पीक-विशिष्ट मार्गदर्शनासाठी स्थानिक कृषी तज्ञांचा सल्ला घ्या.",
        
        "nitrogen_low_title": "नायट्रोजनची कमतरता आढळली",
        "nitrogen_low_desc": "मिमिनीत नायट्रोजन खूप कमी आहे ({value:.1f} mg/kg). झाडांच्या वाढीसाठी त्वरित कारवाई आवश्यक.",
        "nitrogen_low_action": "७ दिवसांत प्रति एकर {bags:.1f} गोणी ({amount_per_acre:.1f} kg) युरिया खत टाका.",
        
        "nitrogen_optimal_title": "नायट्रोजन पातळी इष्टतम",
        "nitrogen_optimal_desc": "नायट्रोजनची पातळी पुरेसी आहे ({value:.1f} mg/kg). कोणत्याही त्वरित कारवाईची गरज नाही.",
        "nitrogen_optimal_action": "निगरानी सुरू ठेवा. १४ दिवसांत पुन्हा चाचणी करा.",
        
        "phosphorus_low_title": "फॉस्फरसची कमतरता",
        "phosphorus_low_desc": "फॉस्फरस इष्टतम पातळीपेक्षा कमी आहे ({value:.1f} mg/kg). मुळांच्या विकासासाठी महत्वाचे.",
        "phosphorus_low_action": "प्रति एकर {bags:.1f} गोणी ({amount_per_acre:.1f} kg) फॉस्फेट खत (DAP किंवा SSP) वापरा.",
        
        "phosphorus_moderate_title": "फॉस्फरस पातळी मध्यम",
        "phosphorus_moderate_desc": "फॉस्फरस ({value:.1f} mg/kg) पुरेसा आहे परंतु चांगल्या मुळांच्या विकासासाठी सुधारला जाऊ शकतो.",
        "phosphorus_moderate_action": "पुढील खत चक्रादरम्यान हलके फॉस्फेट टॉप-ड्रेसिंग लावण्याचा विचार करा.",
        
        "potassium_low_title": "पोटॅशियमची कमतरता",
        "potassium_low_desc": "पोटॅशियमची पातळी कमी आहे ({value:.1f} mg/kg). रोग प्रतिकारशक्तीसाठी आवश्यक.",
        "potassium_low_action": "प्रति एकर {bags:.1f} गोणी ({amount_per_acre:.1f} kg) पोटॅश (MOP) वापरा.",
        
        "potassium_optimal_title": "पोटॅशियम पातळी इष्टतम",
        "potassium_optimal_desc": "पोटॅशियम सामग्री ({value:.1f} mg/kg) निरोगी पीक विकासासाठी आदर्श श्रेणीमध्ये आहे.",
        "potassium_optimal_action": "निगरानी सुरू ठेवा. सध्याचे खत वेळापत्रक कायम ठेवा.",
        
        "irrigation_needed_title": "{crop_type} साठी पाणी आवश्यक",
        "irrigation_needed_desc": "{crop_type} साठी जमिनीतील ओलावा कमी आहे ({value:.1f}%). इष्टतम श्रेणी {min}-{max}% आहे.",
        "irrigation_needed_action": "~{hours:.1f} तास पाण्याचा पंप चालू ठेवा ({inches:.1f} इंच पाणी).",
        "irrigation_rice_action": "शेतात घोट्यापर्यंत (२-३ इंच) पाणी साठवून ठेवा.",
        
        "irrigation_reduce_title": "पाणी कमी करा",
        "irrigation_reduce_desc": "जमिनीतील ओलावा जास्त आहे ({value:.1f}%). पाणी साचण्याचा धोका.",
        "irrigation_reduce_action": "पुढील {days} दिवस पाणी देऊ नका. ड्रेनेज व्यवस्था तपासा.",
        
        "irrigation_optimal_title": "पाणी पातळी इष्टतम",
        "irrigation_optimal_desc": "जमिनीतील ओलावा योग्य श्रेणीमध्ये आहे ({value:.1f}%).",
        "irrigation_optimal_action": "सध्याचे सिंचन वेळापत्रक चालू ठेवा. दररोज निरीक्षण करा.",
        
        "heat_stress_title": "उष्णतेचा ताण इशारा",
        "heat_stress_desc": "तापमान {value:.1f}°C आहे, जे पिकांसाठी जास्त आहे. ताणाचा धोका.",
        "heat_stress_action": "पाणी देण्याची वारंवारता वाढवा. मल्चिंगचा वापर करा.",
        
        "ph_acidic_title": "जमीन खूप आम्लयुक्त आहे",
        "ph_acidic_desc": "pH {value:.1f} खूप आम्लयुक्त आहे. यामुळे पोषक घटकांची उपलब्धता कमी होते.",
        "ph_acidic_action": "कृषी चुना (CaCO3) २-३ टन/हेक्टर टाका.",
        
        "ph_alkaline_title": "जमीन खूप अल्कधर्मी आहे",
        "ph_alkaline_desc": "pH {value:.1f} खूप अल्कधर्मी आहे. सूक्ष्म अन्नद्रव्यांची उपलब्धता मर्यादित करते.",
        "ph_alkaline_action": "गंधक किंवा जिप्समचा वापर करा.",
        
        "ph_optimal_title": "जमीन pH इष्टतम",
        "ph_optimal_desc": "जमिनीचा pH ({value:.1f}) आदर्श श्रेणीमध्ये आहे.",
        "ph_optimal_action": "मासिक pH पातळीची देखरेख सुरू ठेवा.",
        
        "humidity_high_title": "उच्च आर्द्रता इशारा",
        "humidity_high_desc": "हवेतील आर्द्रता ({value:.0f}%) जास्त आहे. बुरशीजन्य रोगांचा धोका.",
        "humidity_high_action": "बुरशीजन्य संसर्गासाठी निरीक्षण करा. हवे खेळती ठेवा.",
        
        "rain_warning_title": "पाऊस अपेक्षित - पाणी थांबवा",
        "rain_warning_desc": "हवामान अंदाजात पाऊस दर्शविला आहे. जास्त पाणी देणे टाळा.",
        "rain_warning_action": "पाऊस पडून जाईपर्यंत पाणी देणे थांबवा.",
        
        "salinity_high_title": "जमिनीतील क्षारता जास्त",
        "salinity_high_desc": "EC ({value:.2f} dS/m) उच्च क्षारता दर्शवते.",
        "salinity_high_action": "जिप्सम उपचार करा. ड्रेनेज सुधारा.",
        
        "salinity_normal_title": "जमिनीतील क्षारता सामान्य",
        "salinity_normal_desc": "EC ({value:.2f} dS/m) स्वीकार्य श्रेणीमध्ये आहे.",
        "salinity_normal_action": "वेळोवेळी EC पातळीचे निरीक्षण करा."
    }
}

class LocalizationManager:
    """Helper to get localized strings based on keys"""
    
    @staticmethod
    def get_text(key: str, lang: str = "en", **kwargs) -> str:
        """Get text for key in language, formatting with kwargs"""
        # Default to English if language not found
        lang_dict = LOCALE_STRINGS.get(lang.lower(), LOCALE_STRINGS["en"])
        
        # Fallback to English key if not in target language
        template = lang_dict.get(key)
        if not template:
            template = LOCALE_STRINGS["en"].get(key, key)
            
        try:
            return template.format(**kwargs)
        except Exception as e:
            print(f"Localization error for {key}: {e}")
            return template  # Return unformatted integer
