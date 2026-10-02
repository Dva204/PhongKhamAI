import re
import logging
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
import joblib
import pandas as pd
from underthesea import word_tokenize
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import ChuyenKhoa, BacSi, NguoiDung, TaiKhoan
from app.models.medical import TuKhoaCapCuu
from app.models.appointment import PhanTichAI
from app.schemas.ai import (
    SymptomTriageRequest, 
    SymptomTriageResponse, 
    SpecialtySuggestion,
    TopDiseasePrediction,
    CSVSymptomItem
)
from app.schemas.appointment import DoctorBriefResponse

logger = logging.getLogger("clinic_backend")

# Path to AI model assets
ASSETS_DIR = Path(__file__).parent.parent / "ai_assets"
MODEL_PATH = ASSETS_DIR / "ai_symptom_model.joblib"
VECTORIZER_PATH = ASSETS_DIR / "tfidf_vectorizer.joblib"
TRAINING_CSV_PATH = ASSETS_DIR / "training_data.csv"


# 1. Map 132 symptoms from CSV to Vietnamese medical terms
CSV_SYMPTOM_MAP_VN = {
    'itching': 'Ngứa ngáy',
    'skin_rash': 'Nổi mẩn đỏ / Phát ban',
    'nodal_skin_eruptions': 'Nổi nốt mụn trên da',
    'continuous_sneezing': 'Hắt hơi liên tục',
    'shivering': 'Rét run / Run rẩy',
    'chills': 'Ớn lạnh',
    'joint_pain': 'Đau khớp / Nhức khớp',
    'stomach_pain': 'Đau dạ dày / Bao tử',
    'acidity': 'Ợ chua / Ợ hơi',
    'ulcers_on_tongue': 'Loét lưỡi / Nhiệt miệng',
    'muscle_wasting': 'Teo cơ',
    'vomiting': 'Buồn nôn / Nôn ói',
    'burning_micturition': 'Tiểu buốt / Đau khi tiểu',
    'spotting_ urination': 'Tiểu rắt / Tiểu lắt nhắt',
    'fatigue': 'Mệt mỏi / Kiệt sức',
    'weight_gain': 'Tăng cân đột ngột',
    'anxiety': 'Lo âu / Mất ngủ',
    'cold_hands_and_feets': 'Tay chân lạnh',
    'mood_swings': 'Thay đổi tâm trạng',
    'weight_loss': 'Sút cân / Giảm cân',
    'restlessness': 'Bồn chồn / Trằn trọc',
    'lethargy': 'Ù lỳ / Uể uải',
    'patches_in_throat': 'Mảng trắng trong họng',
    'irregular_sugar_level': 'Đường huyết không ổn định',
    'cough': 'Ho',
    'high_fever': 'Sốt cao',
    'sunken_eyes': 'Mắt trũng',
    'breathlessness': 'Khó thở / Hụt hơi',
    'sweating': 'Đổ mồ hôi / Vã mồ hôi',
    'dehydration': 'Mất nước / Khô cổ',
    'indigestion': 'Khó tiêu / Ăn không tiêu',
    'headache': 'Đau đầu / Nhức đầu',
    'yellowish_skin': 'Vàng da',
    'dark_urine': 'Nước tiểu sẫm màu',
    'nausea': 'Buồn nôn',
    'loss_of_appetite': 'Chán ăn / Ăn không ngon',
    'pain_behind_the_eyes': 'Đau sau hốc mắt',
    'back_pain': 'Đau lưng / Nhức lưng',
    'constipation': 'Táo bón',
    'abdominal_pain': 'Đau bụng',
    'diarrhoea': 'Tiêu chảy / Đi ngoài lỏng',
    'mild_fever': 'Sốt nhẹ',
    'yellow_urine': 'Nước tiểu màu vàng đậm',
    'yellowing_of_eyes': 'Vàng mắt',
    'acute_liver_failure': 'Suy gan cấp',
    'fluid_overload': 'Tích nước toàn thân',
    'swelling_of_stomach': 'Sưng bụng',
    'swelled_lymph_nodes': 'Sưng hạch / Nổi hạch',
    'malaise': 'Khó chịu toàn thân',
    'blurred_and_distorted_vision': 'Nhìn mờ / Rối loạn thị giác',
    'phlegm': 'Đờm',
    'throat_irritation': 'Đau họng / Rát họng',
    'redness_of_eyes': 'Đỏ mắt',
    'sinus_pressure': 'Đau xoang / Áp lực xoang',
    'runny_nose': 'Sổ mũi / Chảy nước mũi',
    'congestion': 'Nghẹt mũi / Tắc mũi',
    'chest_pain': 'Đau ngực / Tức ngực',
    'weakness_in_limbs': 'Yếu tay chân',
    'fast_heart_rate': 'Tim đập nhanh',
    'pain_during_bowel_movements': 'Đau khi đại tiện / Rặn đau',
    'pain_in_anal_region': 'Đau vùng hậu môn',
    'bloody_stool': 'Đi ngoài ra máu',
    'irritation_in_anus': 'Ngứa hậu môn',
    'neck_pain': 'Đau cổ / Đau vai cổ',
    'dizziness': 'Chóng mặt / Choáng váng',
    'cramps': 'Chuột rút',
    'bruising': 'Vết bầm tím',
    'obesity': 'Béo phì',
    'swollen_legs': 'Sưng chân',
    'swollen_blood_vessels': 'Sưng mạch máu',
    'puffy_face_and_eyes': 'Sưng mặt và mắt',
    'enlarged_thyroid': 'Tuyến giáp to / Bướu cổ',
    'brittle_nails': 'Móng tay giòn / Dễ gãy',
    'swollen_extremeties': 'Sưng chi (tay/chân)',
    'excessive_hunger': 'Đói cồn cào / Thèm ăn',
    'extra_marital_contacts': 'Quan hệ không an toàn',
    'drying_and_tingling_lips': 'Khô môi / Tê môi',
    'slurred_speech': 'Nói ngọng / Khó nói',
    'knee_pain': 'Đau đầu gối',
    'hip_joint_pain': 'Đau khớp háng',
    'muscle_weakness': 'Yếu cơ',
    'stiff_neck': 'Cứng cổ',
    'swelling_joints': 'Sưng khớp',
    'movement_stiffness': 'Cứng khớp khi vận động',
    'spinning_movements': 'Chóng mặt quay mòng mòng',
    'loss_of_balance': 'Mất thăng bằng',
    'unsteadiness': 'Đi đứng không vững',
    'weakness_of_one_body_side': 'Yếu / Liệt nửa người',
    'loss_of_smell': 'Mất khứu giác / Mất mùi',
    'bladder_discomfort': 'Khó chịu bàng quang',
    'foul_smell_of urine': 'Nước tiểu có mùi hôi',
    'continuous_feel_of_urine': 'Buồn tiểu liên tục',
    'passage_of_gases': 'Trung tiện / Xì hơi / Đầy hơi',
    'internal_itching': 'Ngứa bên trong',
    'toxic_look_(typhos)': 'Vẻ mặt nhiễm độc (Thương hàn)',
    'depression': 'Trầm cảm / U uất',
    'irritability': 'Dễ cáu gắt',
    'muscle_pain': 'Đau cơ / Nhức cơ',
    'altered_sensorium': 'Rối loạn tri giác / Lú lẫn',
    'red_spots_over_body': 'Nốt đỏ toàn thân',
    'belly_pain': 'Đau vùng bụng',
    'abnormal_menstruation': 'Kinh nguyệt không đều',
    'dischromic _patches': 'Đốm da đổi màu',
    'watering_from_eyes': 'Chảy nước mắt',
    'increased_appetite': 'Ăn nhiều đột ngột',
    'polyuria': 'Tiểu nhiều lần',
    'family_history': 'Tiền sử gia đình',
    'mucoid_sputum': 'Đờm nhầy',
    'rusty_sputum': 'Đờm rỉ sắt',
    'lack_of_concentration': 'Mất tập trung',
    'visual_disturbances': 'Rối loạn thị giác',
    'receiving_blood_transfusion': 'Tiền sử truyền máu',
    'receiving_unsterile_injections': 'Tiêm không tiệt trùng',
    'coma': 'Hôn mê',
    'stomach_bleeding': 'Xuất huyết dạ dày',
    'distention_of_abdomen': 'Chướng bụng / Trướng bụng',
    'history_of_alcohol_consumption': 'Tiền sử uống rượu bia',
    'fluid_overload.1': 'Tích nước / Phù',
    'blood_in_sputum': 'Ho ra máu / Đờm có máu',
    'prominent_veins_on_calf': 'Nổi tĩnh mạch ở bắp chân',
    'palpitations': 'Hồi hộp / Đánh trống ngực',
    'painful_walking': 'Đau khi đi lại',
    'pus_filled_pimples': 'Mụn mủ',
    'blackheads': 'Mụn đầu đen',
    'scurring': 'Sẹo mụn',
    'skin_peeling': 'Bong tróc da',
    'silver_like_dusting': 'Vảy bạc trên da',
    'small_dents_in_nails': 'Lỗ nhỏ trên móng',
    'inflammatory_nails': 'Viêm móng',
    'blister': 'Mụn nước / Phồng rộp',
    'red_sore_around_nose': 'Lở đỏ quanh mũi',
    'yellow_crust_ooze': 'Vảy đóng rỉ vàng'
}

# 2. Map 41 diseases to clinic specialties & Vietnamese names
DISEASE_TRANSLATION_MAP = {
    "(vertigo) Paroymsal  Positional Vertigo": ("Chóng mặt tư thế lành tính", "Tai - Mũi - Họng"),
    "AIDS": ("Hội chứng suy giảm miễn dịch (AIDS)", "Nội tổng quát"),
    "Acne": ("Mụn trứng cá", "Da liễu"),
    "Alcoholic hepatitis": ("Viêm gan do rượu", "Tiêu hóa"),
    "Allergy": ("Dị ứng", "Da liễu"),
    "Arthritis": ("Viêm khớp", "Cơ xương khớp"),
    "Bronchial Asthma": ("Hen suyễn / Hen phế quản", "Hô hấp"),
    "Cervical spondylosis": ("Thoái hóa đốt sống cổ", "Cơ xương khớp"),
    "Chicken pox": ("Bệnh thủy đậu", "Da liễu"),
    "Chronic cholestasis": ("Ứ mật mãn tính", "Tiêu hóa"),
    "Common Cold": ("Cảm lạnh thông thường", "Tai - Mũi - Họng"),
    "Dengue": ("Sốt xuất huyết Dengue", "Nội tổng quát"),
    "Diabetes": ("Đái tháo đường / Tiểu đường", "Nội tiết"),
    "Diabetes ": ("Đái tháo đường / Tiểu đường", "Nội tiết"),
    "Dimorphic hemmorhoids(piles)": ("Bệnh trĩ", "Tiêu hóa"),
    "Drug Reaction": ("Phản ứng dị ứng thuốc", "Da liễu"),
    "Fungal infection": ("Nhiễm nấm da", "Da liễu"),
    "GERD": ("Trào ngược dạ dày thực quản (GERD)", "Tiêu hóa"),
    "Gastroenteritis": ("Viêm dạ dày ruột", "Tiêu hóa"),
    "Heart attack": ("Cơn đau thắt ngực / Đột quỵ tim", "Tim mạch"),
    "Hepatitis B": ("Viêm gan B", "Tiêu hóa"),
    "Hepatitis C": ("Viêm gan C", "Tiêu hóa"),
    "Hepatitis D": ("Viêm gan D", "Tiêu hóa"),
    "Hepatitis E": ("Viêm gan E", "Tiêu hóa"),
    "hepatitis A": ("Viêm gan A", "Tiêu hóa"),
    "Hypertension": ("Tăng huyết áp", "Tim mạch"),
    "Hypertension ": ("Tăng huyết áp", "Tim mạch"),
    "Hyperthyroidism": ("Cường giáp", "Nội tiết"),
    "Hypoglycemia": ("Hạ đường huyết", "Nội tiết"),
    "Hypothyroidism": ("Suy giáp", "Nội tiết"),
    "Impetigo": ("Bệnh chốc lở", "Da liễu"),
    "Jaundice": ("Vàng da sinh lý / bệnh lý", "Tiêu hóa"),
    "Malaria": ("Bệnh sốt rét", "Nội tổng quát"),
    "Migraine": ("Đau nửa đầu Migraine", "Thần kinh"),
    "Osteoarthristis": ("Thoái hóa khớp", "Cơ xương khớp"),
    "Paralysis (brain hemorrhage)": ("Tai biến / Xuất huyết não gây liệt", "Thần kinh"),
    "Peptic ulcer diseae": ("Loét dạ dày tá tràng", "Tiêu hóa"),
    "Pneumonia": ("Viêm phổi", "Hô hấp"),
    "Psoriasis": ("Bệnh vẩy nến", "Da liễu"),
    "Tuberculosis": ("Bệnh lao phổi", "Hô hấp"),
    "Typhoid": ("Bệnh thương hàn", "Nội tổng quát"),
    "Urinary tract infection": ("Nhiễm trùng đường tiết niệu", "Thần kinh"),
    "Varicose veins": ("Suy giãn tĩnh mạch chân", "Tim mạch")
}

RED_FLAGS_KEYWORDS = [
    "đau ngực dữ dội", "khó thở cấp", "ngất xỉu", "co giật", 
    "đột quỵ", "chảy máu nhiều", "bất tỉnh", "nói ngọng cấp tính", 
    "liệt nửa người", "nôn ra máu tươi", "ho ra máu tươi"
]

VIETNAMESE_SYMPTOM_MAP = {
    # 1. Thần kinh - Đầu - Đột quỵ - Tiền đình
    'đau đầu': 'đau_đầu headache', 'nhức đầu': 'đau_đầu headache', 'đau nửa đầu': 'đau_đầu headache',
    'dau dau': 'đau_đầu headache', 'nhuc dau': 'đau_đầu headache',
    'chóng mặt': 'chóng_mặt dizziness spinning_movements', 'choáng váng': 'chóng_mặt dizziness spinning_movements', 'xây xẩm': 'chóng_mặt dizziness',
    'chong mat': 'chóng_mặt dizziness spinning_movements', 'choang vang': 'chóng_mặt dizziness',
    'mất thăng bằng': 'mất_thăng_bằng unsteadiness loss_of_balance', 'choạng vạng': 'mất_thăng_bằng unsteadiness', 'mat thang bang': 'mất_thăng_bằng unsteadiness',
    'nói ngọng': 'slurred_speech', 'khó nói': 'slurred_speech', 'nói lắp': 'slurred_speech', 'noi ngong': 'slurred_speech',
    'yếu nửa người': 'weakness_of_one_body_side', 'tê liệt': 'weakness_of_one_body_side', 'tê nửa người': 'weakness_of_one_body_side', 'yeu nua nguoi': 'weakness_of_one_body_side',
    'rối loạn tri giác': 'altered_sensorium', 'lú lẫn': 'altered_sensorium', 'hôn mê': 'coma',
    'đau sau hốc mắt': 'pain_behind_the_eyes', 'nhức hốc mắt': 'pain_behind_the_eyes', 'nhuc hoc mat': 'pain_behind_the_eyes',

    # 2. Tiêu hóa - Bụng - Gan mật - Trĩ
    'đau bụng': 'đau_bụng belly_pain abdominal_pain', 'đau bao tử': 'đau_dạ_dày stomach_pain', 'đau dạ dày': 'đau_dạ_dày stomach_pain',
    'dau bung': 'đau_bụng belly_pain abdominal_pain', 'dau bao tu': 'đau_dạ_dày stomach_pain', 'dau da day': 'đau_dạ_dày stomach_pain',
    'buồn nôn': 'buồn_nôn nausea vomiting', 'muốn ói': 'buồn_nôn nausea', 'buon non': 'buồn_nôn nausea',
    'nôn': 'buồn_nôn vomiting', 'ói': 'buồn_nôn vomiting', 'non': 'buồn_nôn vomiting',
    'tiêu chảy': 'tiêu_chảy diarrhoea', 'đi ngoài': 'tiêu_chảy diarrhoea', 'đi lỏng': 'tiêu_chảy diarrhoea', 'tào tháo đuổi': 'tiêu_chảy diarrhoea',
    'tieu chay': 'tiêu_chảy diarrhoea', 'di ngoai': 'tiêu_chảy diarrhoea',
    'ợ chua': 'ợ_chua acidity', 'ợ hơi': 'ợ_chua acidity', 'trào ngược': 'ợ_chua GERD', 'o chua': 'ợ_chua acidity', 'trao nguoc': 'ợ_chua GERD',
    'khó tiêu': 'khó_tiêu indigestion', 'đầy bụng': 'khó_tiêu indigestion distention_of_abdomen', 'chướng bụng': 'distention_of_abdomen swelling_of_stomach',
    'kho tieu': 'khó_tiêu indigestion', 'day bung': 'distention_of_abdomen',
    'táo bón': 'táo_bón constipation', 'tao bon': 'táo_bón constipation',
    'chán ăn': 'chán_ăn loss_of_appetite', 'ăn không ngon': 'chán_ăn loss_of_appetite', 'chan an': 'chán_ăn loss_of_appetite',
    'vàng da': 'vàng_da yellowish_skin jaundice', 'vang da': 'vàng_da yellowish_skin jaundice',
    'vàng mắt': 'vàng_mắt yellowing_of_eyes jaundice', 'vang mat': 'vàng_mắt yellowing_of_eyes',
    'nước tiểu sẫm màu': 'nước_tiểu_sẫm_màu dark_urine', 'nước tiểu vàng đậm': 'nước_tiểu_sẫm_màu dark_urine', 'nước tiểu vàng': 'yellow_urine',
    'loét lưỡi': 'loét_lưỡi ulcers_on_tongue', 'nhiệt miệng': 'loét_lưỡi ulcers_on_tongue',
    'xuất huyết dạ dày': 'stomach_bleeding', 'nôn ra máu': 'stomach_bleeding',
    'đi ngoài ra máu': 'bloody_stool pain_during_bowel_movements', 'phân có máu': 'bloody_stool', 'rặn đau': 'pain_during_bowel_movements',
    'ngứa hậu môn': 'irritation_in_anus', 'đau hậu môn': 'pain_in_anal_region',
    'xì hơi': 'passage_of_gases', 'trung tiện': 'passage_of_gases', 'đầy hơi': 'passage_of_gases',

    # 3. Hô hấp & Tai Mũi Họng
    'sốt cao': 'sốt_cao high_fever', 'sot cao': 'sốt_cao high_fever',
    'sốt nhẹ': 'sốt_nhẹ mild_fever', 'sot nhe': 'sốt_nhẹ mild_fever',
    'sốt': 'sốt_cao high_fever', 'sot': 'sốt_cao high_fever',
    'khó thở': 'khó_thở breathlessness', 'hụt hơi': 'khó_thở breathlessness', 'kho tho': 'khó_thở breathlessness',
    'đau ngực': 'đau_ngực chest_pain', 'tức ngực': 'đau_ngực chest_pain', 'dau nguc': 'đau_ngực chest_pain', 'tuc nguc': 'đau_ngực chest_pain',
    'ho khan': 'ho cough', 'ho có đờm': 'ho phlegm cough mucoid_sputum', 'ho đờm': 'ho phlegm mucoid_sputum', 'ho ra máu': 'ho blood_in_sputum', 'ho': 'ho cough',
    'sổ mũi': 'runny_nose', 'chảy nước mũi': 'runny_nose', 'so mui': 'runny_nose',
    'nghẹt mũi': 'congestion sinus_pressure', 'tắc mũi': 'congestion', 'nghet mui': 'congestion',
    'đau họng': 'throat_irritation', 'rát họng': 'throat_irritation', 'ngứa họng': 'throat_irritation', 'dau hong': 'throat_irritation', 'rat hong': 'throat_irritation',
    'mảng trắng trong họng': 'patches_in_throat',
    'hắt hơi liên tục': 'hắt_hơi_liên_tục continuous_sneezing', 'hắt hơi': 'hắt_hơi_liên_tục continuous_sneezing', 'hat hoi': 'hắt_hơi_liên_tục continuous_sneezing',
    'đờm nhầy': 'mucoid_sputum', 'đờm rỉ sắt': 'rusty_sputum', 'đờm': 'phlegm', 'dom': 'phlegm',

    # 4. Da liễu
    'nổi mẩn đỏ': 'nổi_mẩn_đỏ skin_rash red_spots_over_body', 'nổi mẩn': 'nổi_mẩn_đỏ skin_rash', 'noi man do': 'nổi_mẩn_đỏ skin_rash',
    'phát ban': 'phát_ban skin_rash', 'phat ban': 'phát_ban skin_rash',
    'ngứa ngáy': 'ngứa itching', 'ngứa': 'ngứa itching', 'ngua': 'ngứa itching',
    'mụn mủ': 'pus_filled_pimples', 'mụn đầu đen': 'blackheads', 'mụn trứng cá': 'blackheads pus_filled_pimples scurring', 'mun mu': 'pus_filled_pimples',
    'bong tróc da': 'skin_peeling', 'lột da': 'skin_peeling',
    'vảy bạc': 'silver_like_dusting', 'móng tay lỗ': 'small_dents_in_nails', 'viêm móng': 'inflammatory_nails',
    'mụn nước': 'blister', 'lở quanh mũi': 'red_sore_around_nose', 'vảy đóng rỉ': 'yellow_crust_ooze',
    'đốm da đổi màu': 'dischromic _patches',

    # 5. Cơ xương khớp
    'đau khớp': 'đau_khớp joint_pain', 'nhức khớp': 'đau_khớp joint_pain', 'sưng khớp': 'swelling_joints joint_pain',
    'dau khop': 'đau_khớp joint_pain', 'sung khop': 'swelling_joints',
    'đau lưng': 'đau_lưng back_pain', 'nhức lưng': 'đau_lưng back_pain', 'dau lung': 'đau_lưng back_pain',
    'đau cơ': 'đau_cơ muscle_pain', 'nhức cơ': 'đau_cơ muscle_pain', 'mỏi cơ': 'đau_cơ muscle_pain', 'dau co': 'đau_cơ muscle_pain',
    'đau đầu gối': 'knee_pain', 'đau gối': 'knee_pain', 'dau goi': 'knee_pain',
    'đau khớp háng': 'hip_joint_pain',
    'cứng cổ': 'cứng_cổ neck_pain stiff_neck', 'đau cổ': 'neck_pain stiff_neck', 'cung co': 'cứng_cổ neck_pain',
    'đau vai cổ': 'neck_pain stiff_neck', 'đau vai': 'neck_pain',
    'cứng khớp': 'movement_stiffness', 'đi lại đau': 'painful_walking', 'đi đứng khó khăn': 'painful_walking',

    # 6. Tim mạch - Tiết niệu - Nội tiết - Toàn thân
    'mệt mỏi': 'mệt_mỏi fatigue malaise', 'uể uải': 'mệt_mỏi fatigue malaise', 'đuối sức': 'mệt_mỏi fatigue',
    'met moi': 'mệt_mỏi fatigue', 'ue uai': 'mệt_mỏi fatigue',
    'rét run': 'rét_run shivering chills', 'ớn lạnh': 'ớn_lạnh chills', 'ret run': 'rét_run shivering', 'on lanh': 'ớn_lạnh chills',
    'đổ mồ hôi': 'đổ_mồ_hôi sweating', 'vã mồ hôi': 'đổ_mồ_hôi sweating', 'do mo hoi': 'đổ_mồ_hôi sweating',
    'tiểu buốt': 'tiểu_buốt burning_micturition', 'tiểu rắt': 'spotting_urination continuous_feel_of_urine', 'đau khi tiểu': 'tiểu_buốt burning_micturition',
    'tiểu nhiều': 'polyuria continuous_feel_of_urine', 'buồn tiểu liên tục': 'continuous_feel_of_urine bladder_discomfort',
    'nước tiểu hôi': 'foul_smell_of', 'khó chịu bàng quang': 'bladder_discomfort',
    'tieu buot': 'tiểu_buốt burning_micturition', 'tieu rat': 'spotting_urination',
    'tim đập nhanh': 'tim_đập_nhanh fast_heart_rate palpitations', 'hồi hộp': 'palpitations tim_đập_nhanh', 'tim dap nhanh': 'tim_đập_nhanh fast_heart_rate',
    'mất ngủ': 'anxiety lo_âu', 'lo âu': 'lo_âu anxiety', 'bồn chồn': 'bồn_chồn restlessness', 'lo au': 'lo_âu anxiety',
    'sút cân': 'giảm_cân weight_loss', 'giảm cân': 'giảm_cân weight_loss', 'sut can': 'giảm_cân weight_loss',
    'tăng cân': 'tăng_cân weight_gain', 'mập lên': 'tăng_cân weight_gain',
    'thèm ăn': 'increased_appetite excessive_hunger', 'đói cồn cào': 'excessive_hunger',
    'béo phì': 'béo_phì obesity', 'beo phi': 'béo_phì obesity',
    'sưng hạch': 'swelled_lymph_nodes', 'nổi hạch': 'swelled_lymph_nodes', 'sung hach': 'swelled_lymph_nodes',
    'nhìn mờ': 'blurred_and_distorted_vision', 'mờ mắt': 'blurred_and_distorted_vision', 'nhin mo': 'blurred_and_distorted_vision',
    'mất nước': 'mất_nước dehydration', 'khô cổ': 'dehydration',
    'tay chân lạnh': 'tay_chân_lạnh cold_hands_and_feets', 'lạnh tay chân': 'tay_chân_lạnh cold_hands_and_feets',
    'tuyến giáp to': 'enlarged_thyroid', 'bướu cổ': 'enlarged_thyroid',
    'móng tay giòn': 'brittle_nails', 'sưng tay chân': 'swollen_extremeties',
    'nổi tĩnh mạch chân': 'prominent_veins_on_calf swollen_legs', 'sưng chân': 'swollen_legs', 'chuột rút': 'cramps', 'vết bầm': 'bruising',
    'truyền máu': 'receiving_blood_transfusion', 'tiêm không tiệt trùng': 'receiving_unsterile_injections',
    'uống rượu bia': 'history_of_alcohol_consumption', 'tiền sử rượu bia': 'history_of_alcohol_consumption',
    'dễ cáu gắt': 'dễ_cáu_gắt irritability', 'trầm cảm': 'trầm_cảm depression', 'thay đổi tâm trạng': 'thay_đổi_tâm_trạng mood_swings',
    'yếu cơ': 'yếu_cơ muscle_weakness', 'teo cơ': 'teo_cơ muscle_wasting'
}

# Compile Regex Pattern for matching symptoms
sorted_phrases = sorted(VIETNAMESE_SYMPTOM_MAP.keys(), key=len, reverse=True)
MEDICAL_PATTERN = re.compile(r'(' + '|'.join(re.escape(k) for k in sorted_phrases) + r')')


class AIService:
    """Tầng Control xử lý Trí tuệ nhân tạo phân tích triệu chứng từ mô hình Machine Learning & Red Flags (Package C)"""

    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.df_csv = None
        self.load_resources()

    def load_resources(self):
        """Nạp mô hình AI joblib, TF-IDF Vectorizer và dữ liệu CSV huấn luyện"""
        try:
            if MODEL_PATH.exists() and VECTORIZER_PATH.exists():
                self.model = joblib.load(MODEL_PATH)
                self.vectorizer = joblib.load(VECTORIZER_PATH)
                logger.info("✅ [AI SERVICE] Nạp thành công mô hình AI & TFIDF Vectorizer từ TestAI!")
            else:
                logger.warning(f"⚠️ [AI SERVICE] Không tìm thấy file mô hình tại {ASSETS_DIR}")
            
            if TRAINING_CSV_PATH.exists():
                self.df_csv = pd.read_csv(TRAINING_CSV_PATH, encoding="utf-16")
                logger.info(f"✅ [AI SERVICE] Nạp thành công Dataset CSV: {self.df_csv.shape[0]} dòng")
        except Exception as e:
            logger.error(f"❌ [AI SERVICE] Lỗi khi nạp mô hình AI: {str(e)}")

    def normalize_vietnamese(self, raw_text: str) -> str:
        """Chuẩn hóa chuỗi tiếng Việt sang Unicode NFC, chữ thường và loại bỏ ký tự đặc biệt"""
        import unicodedata
        text_clean = unicodedata.normalize('NFC', raw_text).lower().strip()
        text_clean = re.sub(r'[^\w\s]', ' ', text_clean)
        return re.sub(r'\s+', ' ', text_clean).strip()

    def get_csv_symptoms_list(self) -> List[CSVSymptomItem]:
        """Trả về danh sách 132 triệu chứng chuẩn CSV cho Frontend Checklist tab"""
        items = []
        for code, name_vn in CSV_SYMPTOM_MAP_VN.items():
            items.append(CSVSymptomItem(code=code, name_vn=name_vn))
        return items

    def preprocess_vietnamese_symptoms(self, raw_text: str) -> Tuple[str, List[str]]:
        """Tiền xử lý NLP câu Tiếng Việt tự nhiên và trích xuất từ khóa triệu chứng"""
        text_clean = raw_text.lower().strip()
        text_clean = re.sub(r'[^\w\s]', ' ', text_clean)
        matched_phrases = []

        def replace_func(match):
            phrase = match.group(1)
            matched_phrases.append(phrase)
            return f" {VIETNAMESE_SYMPTOM_MAP[phrase]} "

        text_clean = MEDICAL_PATTERN.sub(replace_func, text_clean)
        tokenized_text = word_tokenize(text_clean, format="text")
        return tokenized_text, matched_phrases

    def run_prediction_pipeline(self, tokenized_text: str) -> Dict[str, Any]:
        """Chạy dự đoán qua TF-IDF Vectorizer và Scikit-Learn Machine Learning Model"""
        if not self.model or not self.vectorizer:
            raise RuntimeError("Mô hình AI chưa được nạp sẵn sàng!")

        X_input = self.vectorizer.transform([tokenized_text])
        feature_match_count = X_input.nnz

        predicted_disease_raw = self.model.predict(X_input)[0]
        probabilities = self.model.predict_proba(X_input)[0]
        confidence_score = float(max(probabilities) * 100)
        predicted_disease_clean = predicted_disease_raw.strip()

        disease_vn, recommended_specialty = DISEASE_TRANSLATION_MAP.get(
            predicted_disease_raw,
            DISEASE_TRANSLATION_MAP.get(predicted_disease_clean, (predicted_disease_clean, "Nội tổng quát"))
        )

        note_text = ""
        default_assigned = False
        if feature_match_count == 0 or confidence_score < 8.0:
            recommended_specialty = "Nội tổng quát"
            default_assigned = True
            note_text = "Mô hình chưa nhận diện đủ triệu chứng đặc hiệu. Hệ thống khuyến nghị khám Nội tổng quát để bác sĩ trực tiếp kiểm tra."

        # Trích xuất Top 3 chẩn đoán khả thi nhất
        top3_indices = probabilities.argsort()[-3:][::-1]
        top_predictions = []
        for idx in top3_indices:
            d_raw = self.model.classes_[idx]
            d_clean = d_raw.strip()
            d_vn, d_spec = DISEASE_TRANSLATION_MAP.get(d_raw, DISEASE_TRANSLATION_MAP.get(d_clean, (d_clean, "Nội tổng quát")))
            prob_val = float(probabilities[idx] * 100)
            top_predictions.append({
                "disease_vn": d_vn,
                "disease_en": d_clean,
                "specialty": d_spec,
                "probability_pct": round(prob_val, 2)
            })

        return {
            "disease_vn": disease_vn,
            "disease_en": predicted_disease_clean,
            "specialty": recommended_specialty,
            "confidence": round(confidence_score / 100.0, 4),  # 0.0 - 1.0 scale
            "confidence_pct": round(confidence_score, 2),
            "match_count": feature_match_count,
            "top_predictions": top_predictions,
            "default_assigned": default_assigned,
            "note": note_text
        }

    async def scan_red_flags(self, raw_text: str, db: AsyncSession) -> Tuple[bool, str]:
        """Quét từ điển dấu hiệu cấp cứu nguy hiểm tính mạng (Red Flags Rules)"""
        text_lower = raw_text.lower().strip()

        # 1. Kiểm tra danh sách Red Flags keywords
        for kw in RED_FLAGS_KEYWORDS:
            if kw in text_lower:
                logger.critical(f"🚨 [RED FLAG DETECTED] Bắt trúng từ khóa cấp cứu: '{kw}'")
                return True, f"CẢNH BÁO NGUY CƠ NGUY HIỂM TÍNH MẠNG! Phát hiện dấu hiệu cấp cứu ({kw}). Đề nghị liên hệ 115 hoặc đến ngay phòng Cấp cứu!"

        # 2. Kiểm tra bảng CSDL TuKhoaCapCuu nếu có
        if db:
            try:
                stmt = select(TuKhoaCapCuu).where(TuKhoaCapCuu.is_active.is_(True))
                red_flag_rules = (await db.execute(stmt)).scalars().all()
                for rule in red_flag_rules:
                    if rule.tu_khoa.lower() in text_lower:
                        logger.critical(f"🚨 [RED FLAG DB DETECTED] Bắt trúng luật CSDL: '{rule.tu_khoa}'")
                        return True, rule.huong_dan_xu_tri
            except Exception as e:
                logger.warning(f"Lỗi khi truy vấn TuKhoaCapCuu từ DB: {e}")

        return False, ""

    async def analyze_symptoms(
        self, 
        payload: SymptomTriageRequest, 
        user: TaiKhoan = None, 
        db: AsyncSession = None
    ) -> SymptomTriageResponse:
        """Quy trình phân tích triệu chứng từ NLP / Checklist CSV, dự đoán ML và gợi ý chuyên khoa + bác sĩ"""
        raw_text = payload.trieu_chung or ""

        # Xử lý nếu gửi danh sách triệu chứng chọn từ Checklist 132 CSV
        if payload.selected_symptoms and len(payload.selected_symptoms) > 0:
            # Lấy chuỗi tiếng Việt của các triệu chứng (VD: "Đau đầu / Nhức đầu Mệt mỏi")
            raw_checklist_text = " ".join([CSV_SYMPTOM_MAP_VN.get(c, c) for c in payload.selected_symptoms])
            # Cho qua hàm NLP để tự động map ra các feature (đau_đầu, headache...)
            nlp_tokenized_text, _ = self.preprocess_vietnamese_symptoms(raw_checklist_text)
            
            # Gộp key gốc tiếng Anh (vd: headache) với chuỗi NLP tokenized
            tokenized_text = " ".join(payload.selected_symptoms) + " " + nlp_tokenized_text
            detected_phrases = [CSV_SYMPTOM_MAP_VN.get(c, c) for c in payload.selected_symptoms]
        else:
            tokenized_text, detected_phrases = self.preprocess_vietnamese_symptoms(raw_text)

        # 1. Quét dấu hiệu cấp cứu khẩn cấp Red Flags
        is_emergency, alert_msg = await self.scan_red_flags(raw_text, db)
        if is_emergency:
            if db:
                try:
                    log_ai = PhanTichAI(
                        trieu_chung_nhap=raw_text,
                        co_dau_hieu_cap_cuu=True,
                        do_tin_cay=1.0
                    )
                    db.add(log_ai)
                    await db.commit()
                except Exception:
                    pass

            return SymptomTriageResponse(
                has_emergency=True,
                emergency_alert=alert_msg,
                suggested_specialties=[],
                detected_symptoms=list(set(detected_phrases))
            )

        # 2. Chạy mô hình ML dự đoán
        pred = self.run_prediction_pipeline(tokenized_text)

        target_specialty_name = pred["specialty"]
        confidence = pred["confidence"]
        reason = (
            f"Dựa trên mô hình AI phân tích triệu chứng: dự đoán khả năng gặp phải {pred['disease_vn']} "
            f"({pred['confidence_pct']}% tin cậy) từ {pred['match_count']} đặc trưng trùng khớp."
        )

        # Build gợi ý chuyên khoa & danh sách bác sĩ từ CSDL
        suggestions: List[SpecialtySuggestion] = []
        primary_suggestion = await self._build_specialty_suggestion(
            target_specialty_name, confidence, reason, db
        )
        suggestions.append(primary_suggestion)

        # Thêm chuyên khoa phụ từ top 2 dự đoán nếu có xác suất cao (> 15%)
        if len(pred["top_predictions"]) > 1:
            second_pred = pred["top_predictions"][1]
            if second_pred["probability_pct"] >= 15.0 and second_pred["specialty"] != target_specialty_name:
                second_reason = f"Dự đoán phụ khả thi: {second_pred['disease_vn']} ({second_pred['probability_pct']}%)."
                sec_suggestion = await self._build_specialty_suggestion(
                    second_pred["specialty"], 
                    round(second_pred["probability_pct"] / 100.0, 4), 
                    second_reason, 
                    db
                )
                suggestions.append(sec_suggestion)

        # 3. Ghi vết nhật ký suy luận vào CSDL
        if db:
            try:
                top_suggestion = suggestions[0]
                log_ai = PhanTichAI(
                    trieu_chung_nhap=raw_text,
                    chuyen_khoa_goi_y_id=top_suggestion.chuyen_khoa_id,
                    do_tin_cay=top_suggestion.do_tin_cay,
                    co_dau_hieu_cap_cuu=False
                )
                db.add(log_ai)
                await db.commit()
            except Exception as e:
                logger.warning(f"Không thể ghi vết nhật ký AI: {e}")

        # Top 3 predictions structured objects
        top_prediction_objs = [
            TopDiseasePrediction(**p) for p in pred["top_predictions"]
        ]

        return SymptomTriageResponse(
            has_emergency=False,
            emergency_alert=None,
            suggested_specialties=suggestions,
            default_assigned=pred["default_assigned"],
            predicted_disease_vn=pred["disease_vn"],
            predicted_disease_en=pred["disease_en"],
            detected_symptoms=list(set(detected_phrases)),
            top_predictions=top_prediction_objs,
            match_count=pred["match_count"],
            note=pred["note"]
        )

    async def _build_specialty_suggestion(
        self, 
        specialty_name: str, 
        confidence: float, 
        reason: str, 
        db: AsyncSession
    ) -> SpecialtySuggestion:
        """Helper tìm kiếm chuyên khoa và danh sách bác sĩ tương ứng trong CSDL"""
        doctor_briefs = []
        ck_id = 0
        display_name = specialty_name

        if db:
            try:
                # Tìm chuyên khoa theo tên tiếng Việt
                stmt_ck = select(ChuyenKhoa).where(ChuyenKhoa.ten_chuyen_khoa.ilike(f"%{specialty_name}%"))
                ck = (await db.execute(stmt_ck)).scalar_one_or_none()

                if not ck:
                    # Map tên ngắn nếu tên không khớp tuyệt đối
                    keyword_map = {
                        "Nội tổng quát": "Nội",
                        "Tim mạch": "Tim",
                        "Da liễu": "Da",
                        "Tai - Mũi - Họng": "Tai",
                        "Thần kinh": "Thần",
                        "Cơ xương khớp": "xương",
                        "Hô hấp": "Hô",
                        "Tiêu hóa": "Tiêu",
                        "Nội tiết": "Nội"
                    }
                    search_kw = keyword_map.get(specialty_name, specialty_name)
                    stmt_ck2 = select(ChuyenKhoa).where(ChuyenKhoa.ten_chuyen_khoa.ilike(f"%{search_kw}%"))
                    ck = (await db.execute(stmt_ck2)).scalars().first()

                if ck:
                    ck_id = ck.id
                    display_name = ck.ten_chuyen_khoa
                    stmt_bs = (
                        select(BacSi, NguoiDung)
                        .join(NguoiDung, BacSi.nguoi_dung_id == NguoiDung.id)
                        .where(BacSi.chuyen_khoa_id == ck.id)
                        .limit(3)
                    )
                    bs_list = (await db.execute(stmt_bs)).all()
                    for bac_si, nguoi_dung in bs_list:
                        doctor_briefs.append(
                            DoctorBriefResponse(
                                id=bac_si.id,
                                ho_ten=nguoi_dung.ho_ten,
                                chuyen_khoa=display_name,
                                hoc_vi=bac_si.hoc_vi
                            )
                        )
            except Exception as e:
                logger.warning(f"Lỗi khi tra cứu chuyên khoa/bác sĩ từ DB: {e}")

        return SpecialtySuggestion(
            chuyen_khoa_id=ck_id,
            ten_chuyen_khoa=display_name,
            do_tin_cay=confidence,
            ly_do_de_xuat=reason,
            danh_sach_bac_si=doctor_briefs
        )


ai_service = AIService()
