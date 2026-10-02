import streamlit as st
import joblib
import pandas as pd
from underthesea import word_tokenize
import re

# Cấu hình giao diện trang web test
st.set_page_config(
    page_title="Hệ Thống Phân Tích & Gợi Ý Chuyên Khoa Y Tế AI", 
    page_icon="🏥", 
    layout="wide"
)

st.title("🏥 Hệ Thống Test AI Phân Tích Triệu Chứng & Gợi Ý Chuyên Khoa")
st.write("Giải pháp tích hợp: Xử lý ngôn ngữ tự nhiên Tiếng Việt (NLP), Chọn triệu chứng chuẩn 132 CSV và Dự đoán Chuyên khoa bằng Machine Learning.")

# Nạp mô hình AI, Vectorizer và dữ liệu CSV
@st.cache_resource
def load_resources():
    try:
        model = joblib.load("ai_symptom_model.joblib")
        vectorizer = joblib.load("tfidf_vectorizer.joblib")
        df_csv = pd.read_csv("training_data.csv", encoding="utf-16")
        return model, vectorizer, df_csv, None
    except Exception as e:
        return None, None, None, str(e)

model, vectorizer, df_csv, error_msg = load_resources()

if error_msg:
    st.error(f"❌ Không thể nạp tài nguyên. Hãy đảm bảo file `.joblib` và `training_data.csv` cùng thư mục! Lỗi chi tiết: {error_msg}")
    st.stop()

# 1. Ánh xạ 132 triệu chứng từ file training_data.csv sang Tiếng Việt chuẩn y khoa
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

# 2. Ánh xạ 41 loại bệnh sang Chuyên khoa phòng khám & Tiếng Việt
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
    "Urinary tract infection": ("Nhiễm trùng đường tiết niệu", "Thận - Tiết niệu"),
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
    'đốm da đổi màu': 'dischromic _patches', 'vết thâm da': '_patches',

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

sorted_phrases = sorted(VIETNAMESE_SYMPTOM_MAP.keys(), key=len, reverse=True)
MEDICAL_PATTERN = re.compile(r'(' + '|'.join(re.escape(k) for k in sorted_phrases) + r')')

def preprocess_vietnamese_symptoms(raw_text):
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

def run_prediction_pipeline(tokenized_text):
    X_input = vectorizer.transform([tokenized_text])
    feature_match_count = X_input.nnz
    
    predicted_disease_raw = model.predict(X_input)[0]
    probabilities = model.predict_proba(X_input)[0]
    confidence_score = float(max(probabilities) * 100)
    predicted_disease_clean = predicted_disease_raw.strip()
    
    disease_vn, recommended_specialty = DISEASE_TRANSLATION_MAP.get(
        predicted_disease_raw, 
        DISEASE_TRANSLATION_MAP.get(predicted_disease_clean, (predicted_disease_clean, "Nội tổng quát"))
    )
    
    note_text = ""
    if feature_match_count == 0 or confidence_score < 8.0:
        recommended_specialty = "Nội tổng quát"
        note_text = "Mô hình chưa nhận diện đủ triệu chứng đặc hiệu. Hệ thống khuyến nghị khám Nội tổng quát để bác sĩ trực tiếp kiểm tra."
        
    return {
        "disease_vn": disease_vn,
        "disease_en": predicted_disease_clean,
        "specialty": recommended_specialty,
        "confidence": confidence_score,
        "match_count": feature_match_count,
        "probabilities": probabilities,
        "note": note_text
    }

# Tạo các Tab thử nghiệm
tab1, tab2, tab3 = st.tabs([
    "💬 Chế Độ 1: Nhập Câu Tự Nhiên (NLP)", 
    "📋 Chế Độ 2: Tích Chọn 132 Triệu Chứng Chuẩn CSV", 
    "📊 Chế Độ 3: Thống Kê & Phân Tích Dataset CSV"
])

# --- TAB 1: NLP NATURAL LANGUAGE ---
with tab1:
    st.subheader("💬 Mô tả triệu chứng theo cách của bạn")
    st.caption("Ví dụ: 'Tôi bị đau đầu, chóng mặt, buồn nôn', 'Bị đau bụng tiêu chảy', 'toi bi sot cao ret run'...")
    
    user_input = st.text_area(
        "Nhập cảm giác sức khỏe:", 
        placeholder="Nhập mô tả tại đây...",
        height=120,
        key="nlp_input"
    )
    
    if st.button("Phân tích bằng NLP & AI", type="primary", key="btn_nlp"):
        if not user_input.strip():
            st.warning("⚠️ Vui lòng nhập mô tả trước khi bấm phân tích!")
        else:
            raw_text = user_input.lower().strip()
            
            # 1. Kiểm tra Red Flags
            is_emergency = False
            detected_flag = ""
            for kw in RED_FLAGS_KEYWORDS:
                if kw in raw_text:
                    is_emergency = True
                    detected_flag = kw
                    break
                    
            if is_emergency:
                st.error(f"🚨 **CẢNH BÁO KHẨN CẤP (RED FLAGS)**: Phát hiện dấu hiệu nguy hiểm (`{detected_flag}`). Ngắt luồng đặt lịch thường, vui lòng gọi 115 ngay!")
            else:
                tokenized_text, detected_phrases = preprocess_vietnamese_symptoms(raw_text)
                res = run_prediction_pipeline(tokenized_text)
                
                st.success("✅ Phân tích NLP thành công!")
                col1, col2 = st.columns(2)
                with col1:
                    st.metric(label="📌 Chuyên khoa đề xuất", value=res["specialty"])
                with col2:
                    st.metric(label="📊 Độ tin cậy (Confidence)", value=f"{res['confidence']:.2f}%")
                    
                st.write(f"🔍 **Bệnh dự đoán sơ bộ:** `{res['disease_vn']}` *({res['disease_en']})*")
                
                if detected_phrases:
                    st.info(f"💡 **Các triệu chứng trích xuất được ({len(detected_phrases)}):** " + ", ".join([f"`{p}`" for p in set(detected_phrases)]))
                else:
                    st.warning("⚠️ Không trích xuất được từ khóa triệu chứng rõ ràng trong câu.")
                    
                if res["note"]:
                    st.caption(f"💡 *Ghi chú:* {res['note']}")
                    
                with st.expander("📈 Xem Chi Tiết Top 3 Dự Đoán Bệnh Khả Thi Nhất"):
                    top3_indices = res["probabilities"].argsort()[-3:][::-1]
                    for idx in top3_indices:
                        d_raw = model.classes_[idx]
                        d_clean = d_raw.strip()
                        d_vn, d_spec = DISEASE_TRANSLATION_MAP.get(d_raw, DISEASE_TRANSLATION_MAP.get(d_clean, (d_clean, "Nội tổng quát")))
                        prob_val = res["probabilities"][idx] * 100
                        st.write(f"• **{d_vn}** *({d_clean})* — Chuyên khoa: **{d_spec}**")
                        st.progress(min(float(prob_val / 100.0), 1.0), text=f"{prob_val:.2f}%")

# --- TAB 2: CHECKLIST 132 SYMPTOMS ---
with tab2:
    st.subheader("📋 Chọn trực tiếp từ danh sách 132 Triệu chứng chuẩn (Kaggle Dataset)")
    st.caption("Phương pháp này mang lại độ chính xác 100% khớp theo đúng cơ chế huấn luyện của tập dữ liệu CSV gốc.")
    
    csv_symptom_cols = [c for c in df_csv.columns if c not in ['prognosis', 'Unnamed: 133']]
    
    # Mapping display names
    options_dict = {f"{CSV_SYMPTOM_MAP_VN.get(col, col)} ({col})": col for col in csv_symptom_cols}
    
    selected_options = st.multiselect(
        "Chọn các triệu chứng bạn đang gặp phải:",
        options=list(options_dict.keys()),
        placeholder="Gõ để tìm kiếm triệu chứng (ví dụ: Đau đầu, Sốt cao, Buồn nôn...)"
    )
    
    if st.button("Phân tích từ triệu chứng đã chọn", type="primary", key="btn_checklist"):
        if not selected_options:
            st.warning("⚠️ Vui lòng chọn ít nhất 1 triệu chứng từ danh sách!")
        else:
            selected_cols = [options_dict[opt] for opt in selected_options]
            
            # Map selected columns to tokens (both EN column name and mapped VN terms)
            token_list = []
            for col in selected_cols:
                token_list.append(col)
                vn_label = CSV_SYMPTOM_MAP_VN.get(col, "").lower()
                if vn_label in VIETNAMESE_SYMPTOM_MAP:
                    token_list.append(VIETNAMESE_SYMPTOM_MAP[vn_label])
                    
            text_input_checklist = " ".join(token_list)
            tok_checklist = word_tokenize(text_input_checklist, format="text")
            
            res = run_prediction_pipeline(tok_checklist)
            
            st.success("✅ Phân tích từ Checklist thành công!")
            col1, col2 = st.columns(2)
            with col1:
                st.metric(label="📌 Chuyên khoa đề xuất", value=res["specialty"])
            with col2:
                st.metric(label="📊 Độ tin cậy (Confidence)", value=f"{res['confidence']:.2f}%")
                
            st.write(f"🔍 **Bệnh dự đoán sơ bộ:** `{res['disease_vn']}` *({res['disease_en']})*")
            st.info(f"💡 **Số triệu chứng khớp trong Vectorizer:** `{res['match_count']}` / {len(selected_cols)}")
            
            with st.expander("📈 Xem Chi Tiết Top 3 Dự Đoán Bệnh Khả Thi Nhất"):
                top3_indices = res["probabilities"].argsort()[-3:][::-1]
                for idx in top3_indices:
                    d_raw = model.classes_[idx]
                    d_clean = d_raw.strip()
                    d_vn, d_spec = DISEASE_TRANSLATION_MAP.get(d_raw, DISEASE_TRANSLATION_MAP.get(d_clean, (d_clean, "Nội tổng quát")))
                    prob_val = res["probabilities"][idx] * 100
                    st.write(f"• **{d_vn}** *({d_clean})* — Chuyên khoa: **{d_spec}**")
                    st.progress(min(float(prob_val / 100.0), 1.0), text=f"{prob_val:.2f}%")

# --- TAB 3: DATASET STATS ---
with tab3:
    st.subheader("📊 Thống kê tập dữ liệu huấn luyện `training_data.csv`")
    col_a, col_b, col_c = st.columns(3)
    with col_a:
        st.metric("Tổng số bản ghi (Rows)", f"{df_csv.shape[0]:,}")
    with col_b:
        st.metric("Tổng số triệu chứng (Features)", f"{len(csv_symptom_cols)}")
    with col_c:
        st.metric("Tổng số loại bệnh (Classes)", f"{df_csv['prognosis'].nunique()}")
        
    st.markdown("---")
    st.write("📋 **Danh sách 41 loại bệnh có trong mô hình & Chuyên khoa tương ứng:**")
    
    unique_diseases = df_csv['prognosis'].unique()
    table_data = []
    for d in sorted(unique_diseases):
        d_clean = d.strip()
        d_vn, d_spec = DISEASE_TRANSLATION_MAP.get(d, DISEASE_TRANSLATION_MAP.get(d_clean, (d_clean, "Nội tổng quát")))
        count = (df_csv['prognosis'] == d).sum()
        table_data.append({"Tên bệnh gốc (Kaggle)": d_clean, "Tên tiếng Việt": d_vn, "Chuyên khoa": d_spec, "Số mẫu": count})
        
    st.dataframe(pd.DataFrame(table_data), use_container_width=True)