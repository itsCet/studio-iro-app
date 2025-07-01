import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, onSnapshot, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- FICHIER DU LOGO ---
const logoUrl = 'IMG_6560.jpg';

// --- ÍCÔNES (SVG) ---
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StarIcon = ({ filled }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${filled ? 'text-amber-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const LockClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;


// --- CONFIGURATION FIREBASE ---
// This version works in the preview environment.
// For Netlify, you will need to switch to process.env variables.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


// --- INITIALISATION FIREBASE ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// --- DONNÉES DE L'APPLICATION ---
const services = [
    { id: 'browlift', name: 'Brow Lift', description: 'Restructuration des sourcils (avec/sans teinture et épilation). Le résultat tient 4 à 6 semaines.', price: '25 - 35', durationForDisplay: '45 - 75', durationForBooking: 75 },
    { id: 'lashlift', name: 'Korean Lash Lift', description: 'Rehaussement de cils pour un regard de biche (avec/sans teinture). Le résultat tient 6 à 8 semaines.', price: '30 - 35', durationForDisplay: '60 - 75', durationForBooking: 75 },
    { id: 'combo', name: 'Le Combo', description: 'L\'association parfaite du Lash Lift et du Brow Lift pour un regard intense.', price: '50 - 65', durationForDisplay: '60 - 90', durationForBooking: 90 },
    { id: 'epilation', name: 'Épilation Sourcils', description: 'Entretien ou création de votre ligne de sourcils à la cire.', price: '15', durationForDisplay: '30', durationForBooking: 30 },
];

const DEPOSIT_AMOUNT = 20;
const TWINT_PHONE_NUMBER = "079 123 45 67"; // <-- METTEZ VOTRE VRAI NUMÉRO ICI
const ADMIN_PASSWORD = "admin123"; // <-- Mot de passe pour l'accès admin

// --- COMPOSANTS UI ---
const Header = ({ setPage }) => (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <div className="cursor-pointer" onClick={() => setPage('home')}>
                <img src={logoUrl} alt="Studio Iro Logo" className="h-12" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x50/FBF9F6/78716c?text=Studio+Iro'; }}/>
            </div>
            <div className="flex space-x-4 md:space-x-6">
                {['prestations', 'réserver', 'avis'].map(pageName => (
                    <button key={pageName} onClick={() => setPage(pageName)} className="capitalize text-stone-600 hover:text-stone-900 transition-colors duration-300">
                        {pageName}
                    </button>
                ))}
            </div>
        </nav>
    </header>
);

const HomePage = ({ setPage }) => (
    <div className="text-center py-20 md:py-32 px-6">
        <h1 className="text-4xl md:text-6xl font-light text-stone-800 mb-4 tracking-wider">Sublimez votre regard</h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
            Bienvenue chez Studio Iro, votre expert en Brow Lift et Korean Lash Lift. Découvrez des prestations uniques pour un résultat naturel et élégant.
        </p>
        <button onClick={() => setPage('réserver')} className="bg-stone-800 text-white px-8 py-3 rounded-full hover:bg-stone-700 transition-all duration-300 shadow-lg">
            Réserver mon rendez-vous
        </button>
    </div>
);

const ServicesPage = () => (
    <div className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-light text-center text-stone-800 mb-10">Nos Prestations</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {services.map(service => (
                <div key={service.id} className="bg-white/50 p-6 rounded-lg shadow-sm border border-stone-200/50 flex flex-col">
                    <h3 className="text-xl font-semibold text-stone-800">{service.name}</h3>
                    <p className="text-stone-600 my-2 flex-grow">{service.description}</p>
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-stone-500"><ClockIcon /> {service.durationForDisplay} min</span>
                        <span className="text-lg font-semibold text-stone-800">{service.price} CHF</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ReviewsPage = () => {
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const reviewsCollection = collection(db, `artifacts/${appId}/public/data/reviews`);
        const q = query(reviewsCollection, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const reviewsData = [];
            querySnapshot.forEach((doc) => {
                reviewsData.push({ id: doc.id, ...doc.data() });
            });
            setReviews(reviewsData);
        }, (err) => {
            console.error("Erreur de lecture des avis: ", err);
        });
        return () => unsubscribe();
    }, []);

    const handleAddReview = async (e) => {
        e.preventDefault();
        if (!newReview.name || !newReview.comment) { setError('Veuillez remplir votre nom et votre commentaire.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const reviewsCollection = collection(db, `artifacts/${appId}/public/data/reviews`);
            await addDoc(reviewsCollection, { ...newReview, createdAt: new Date() });
            setNewReview({ name: '', rating: 5, comment: '' });
        } catch (err) {
            console.error("Erreur d'ajout de l'avis: ", err);
            setError('Une erreur est survenue. Veuillez réessayer.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <h2 className="text-3xl font-light text-center text-stone-800 mb-10">Avis de nos clientes</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/50 p-6 rounded-lg shadow-sm border border-stone-200/50">
                    <h3 className="text-xl font-semibold text-stone-800 mb-4">Laissez votre avis</h3>
                    <form onSubmit={handleAddReview}><input type="text" placeholder="Votre nom" value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} className="w-full p-2 border rounded-md mb-3 bg-stone-50 border-stone-200" /><textarea placeholder="Votre commentaire..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className="w-full p-2 border rounded-md mb-3 bg-stone-50 border-stone-200" rows="4"></textarea><div className="flex items-center mb-4"><span className="mr-3 text-stone-600">Note:</span><div className="flex">{[1, 2, 3, 4, 5].map(star => <button type="button" key={star} onClick={() => setNewReview({...newReview, rating: star})}><StarIcon filled={star <= newReview.rating} /></button>)}</div></div>{error && <p className="text-red-500 text-sm mb-3">{error}</p>}<button type="submit" disabled={isSubmitting} className="bg-stone-800 text-white px-6 py-2 rounded-full hover:bg-stone-700 transition-all duration-300 disabled:bg-stone-400">{isSubmitting ? 'Envoi...' : 'Envoyer'}</button></form>
                </div>
                <div className="space-y-6">{reviews.length > 0 ? reviews.map(review => (<div key={review.id} className="bg-white/50 p-5 rounded-lg shadow-sm border border-stone-200/50"><div className="flex justify-between items-start"><h4 className="font-semibold text-stone-800">{review.name}</h4><div className="flex">{[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < review.rating} />)}</div></div><p className="text-stone-600 mt-2">"{review.comment}"</p></div>)) : <p className="text-stone-500">Aucun avis pour le moment. Soyez la première !</p>}</div>
            </div>
        </div>
    );
};

const BookingPage = ({ userId, setPage }) => {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(null);
    const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '' });
    const [bookedSlots, setBookedSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const calendarDays = useMemo(() => {
        const date = new Date(currentYear, currentMonth, 1);
        const days = [];
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfMonth = date.getDay() === 0 ? 6 : date.getDay() - 1;
        for (let i = 0; i < firstDayOfMonth; i++) { days.push({ key: `empty-${i}`, empty: true }); }
        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(currentYear, currentMonth, day);
            days.push({ key: d.toISOString(), day, date: d, isPast: d < today });
        }
        return days;
    }, [currentMonth, currentYear]);

    const changeMonth = (delta) => {
        const newDate = new Date(currentYear, currentMonth + delta, 1);
        setCurrentMonth(newDate.getMonth());
        setCurrentYear(newDate.getFullYear());
    };

    const availableTimes = useMemo(() => {
        if (!selectedService) return [];
        const times = [];
        for (let hour = 9; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                 const slotTime = new Date(selectedDate);
                 slotTime.setHours(hour, minute, 0, 0);
                 if (slotTime < new Date()) continue;
                 const endTime = new Date(slotTime.getTime() + selectedService.durationForBooking * 60000);
                 if (endTime.getHours() > 18 || (endTime.getHours() === 18 && endTime.getMinutes() > 0)) continue;
                 const isBooked = bookedSlots.some(booked => {
                    const bookedStart = booked.startTime.toDate();
                    const bookedEnd = new Date(bookedStart.getTime() + booked.duration * 60000);
                    return (slotTime >= bookedStart && slotTime < bookedEnd) || (endTime > bookedStart && endTime <= bookedEnd);
                 });
                 if (!isBooked) { times.push(slotTime.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })); }
            }
        }
        return times;
    }, [selectedService, selectedDate, bookedSlots]);
    
    useEffect(() => {
        if (!selectedDate) return;
        setIsLoading(true);
        const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
        const appointmentsCollection = collection(db, `artifacts/${appId}/public/data/appointments`);
        const q = query(appointmentsCollection, where("startTime", ">=", startOfDay), where("startTime", "<=", endOfDay));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const bookings = [];
            querySnapshot.forEach((doc) => { bookings.push(doc.data()); });
            setBookedSlots(bookings);
            setIsLoading(false);
        }, (err) => { console.error("Erreur: ", err); setIsLoading(false); });
        return () => unsubscribe();
    }, [selectedDate]);

    const handleSelectService = (service) => { setSelectedService(service); setStep(2); };
    const handleSelectDate = (date) => { if (date < today) return; setSelectedDate(date); setSelectedTime(null); };
    const handleSelectTime = (time) => { setSelectedTime(time); setStep(3); };
    const handleUserInfoSubmit = (e) => { e.preventDefault(); if (userInfo.name && userInfo.email && userInfo.phone) { setStep(4); } };
    
    const handleManualPaymentConfirmation = async () => {
        setIsLoading(true);
        const [hours, minutes] = selectedTime.split(':');
        const finalDateTime = new Date(selectedDate);
        finalDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        try {
            const appointmentsCollection = collection(db, `artifacts/${appId}/public/data/appointments`);
            await addDoc(appointmentsCollection, {
                userId, serviceName: selectedService.name, duration: selectedService.durationForBooking, price: selectedService.price,
                startTime: finalDateTime, client: userInfo, status: 'En attente de validation', createdAt: new Date(), reminderSent: false
            });
            setStep(5);
        } catch (error) { console.error("Erreur lors de la réservation: ", error); } finally { setIsLoading(false); }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1: return (
                <div><h3 className="text-2xl font-light text-center text-stone-800 mb-8">1. Choisissez une prestation</h3><div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">{services.map(service => (<button key={service.id} onClick={() => handleSelectService(service)} className="bg-white/50 p-6 rounded-lg shadow-sm border border-stone-200/50 text-left hover:border-stone-400 hover:shadow-md transition-all duration-300"><h4 className="text-xl font-semibold text-stone-800">{service.name}</h4><p className="text-stone-600 my-2 text-sm">{service.description}</p><div className="flex justify-between items-center mt-4"><span className="text-sm text-stone-500">{service.durationForDisplay} min</span><span className="text-lg font-semibold text-stone-800">{service.price} CHF</span></div></button>))}</div></div>
            );
            case 2: return (
                <div><button onClick={() => setStep(1)} className="text-stone-600 mb-4">&larr; Changer de prestation</button><h3 className="text-2xl font-light text-center text-stone-800 mb-8">2. Choisissez une date et une heure</h3><div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"><div className="bg-white/50 p-4 rounded-lg shadow-sm border border-stone-200/50"><div className="flex justify-between items-center mb-4"><button onClick={() => changeMonth(-1)}>&larr;</button><h4 className="font-semibold">{new Date(currentYear, currentMonth).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h4><button onClick={() => changeMonth(1)}>&rarr;</button></div><div className="grid grid-cols-7 gap-1 text-center text-sm">{['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(day => <div key={day} className="font-semibold text-stone-500">{day}</div>)}{calendarDays.map(day => (day.empty ? <div key={day.key}></div> : <button key={day.key} onClick={() => handleSelectDate(day.date)} disabled={day.isPast} className={`p-2 rounded-full transition-colors ${day.isPast ? 'text-stone-300 cursor-not-allowed' : 'hover:bg-stone-200'} ${selectedDate.toDateString() === day.date.toDateString() ? 'bg-stone-800 text-white' : ''}`}>{day.day}</button>))}</div></div><div className="bg-white/50 p-4 rounded-lg shadow-sm border border-stone-200/50"><h4 className="font-semibold text-center mb-4">Créneaux pour le <br/>{selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>{isLoading ? <p>Chargement...</p> : <div className="grid grid-cols-3 gap-2">{availableTimes.length > 0 ? availableTimes.map(time => (<button key={time} onClick={() => handleSelectTime(time)} className="bg-stone-200/50 p-2 rounded-md text-sm hover:bg-stone-800 hover:text-white transition-colors">{time}</button>)) : <p className="col-span-3 text-center text-stone-500">Aucun créneau disponible.</p>}</div>}</div></div></div>
            );
            case 3: return (
                <div><button onClick={() => setStep(2)} className="text-stone-600 mb-4">&larr; Changer la date</button><h3 className="text-2xl font-light text-center text-stone-800 mb-8">3. Vos informations</h3><div className="max-w-md mx-auto bg-white/50 p-6 rounded-lg shadow-sm border border-stone-200/50"><div className="bg-stone-100 p-4 rounded-md mb-6 text-stone-700"><p><strong>Prestation:</strong> {selectedService.name}</p><p><strong>Date:</strong> {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p><p><strong>Heure:</strong> {selectedTime}</p></div><form onSubmit={handleUserInfoSubmit}><input type="text" placeholder="Nom complet" required value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} className="w-full p-2 border rounded-md mb-3 bg-stone-50 border-stone-200" /><input type="email" placeholder="Email" required value={userInfo.email} onChange={e => setUserInfo({...userInfo, email: e.target.value})} className="w-full p-2 border rounded-md mb-3 bg-stone-50 border-stone-200" /><input type="tel" placeholder="Téléphone" required value={userInfo.phone} onChange={e => setUserInfo({...userInfo, phone: e.target.value})} className="w-full p-2 border rounded-md mb-4 bg-stone-50 border-stone-200" /><button type="submit" className="w-full bg-stone-800 text-white px-6 py-3 rounded-full hover:bg-stone-700 transition-all duration-300">Valider et finaliser</button></form></div></div>
            );
            case 4: return (
                <div><button onClick={() => setStep(3)} className="text-stone-600 mb-4">&larr; Modifier mes informations</button><h3 className="text-2xl font-light text-center text-stone-800 mb-8">4. Finalisez votre réservation</h3><div className="max-w-md mx-auto bg-white/50 p-8 rounded-lg shadow-lg border border-stone-200/50 text-center"><h4 className="text-xl font-semibold text-stone-800">Paiement de l'acompte</h4><p className="text-stone-600 my-4">Pour confirmer votre rendez-vous, veuillez envoyer un acompte de <strong>{DEPOSIT_AMOUNT} CHF</strong> par TWINT au numéro suivant :</p><div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4 flex items-center justify-center"><PhoneIcon /><span className="text-xl font-bold text-blue-800 tracking-wider ml-3">{TWINT_PHONE_NUMBER}</span></div><p className="text-red-600 font-semibold my-4">Important : Veuillez indiquer votre Nom et Prénom complets dans la description du paiement.</p><p className="text-sm text-stone-500 mb-6">Une fois le paiement effectué, cliquez sur le bouton ci-dessous pour enregistrer votre demande de rendez-vous.</p><button onClick={handleManualPaymentConfirmation} disabled={isLoading} className="w-full bg-stone-800 text-white px-6 py-3 rounded-full hover:bg-stone-700 transition-all duration-300">{isLoading ? 'Enregistrement...' : 'J\'ai effectué le paiement'}</button></div></div>
            );
            case 5: return (
                <div className="max-w-md mx-auto text-center py-12"><CheckCircleIcon /><h3 className="text-2xl font-semibold text-stone-800 mt-4 mb-2">Demande de RDV enregistrée !</h3><p className="text-stone-600 mb-6">Merci {userInfo.name}. Votre demande pour un <strong>{selectedService.name}</strong> a bien été prise en compte. Votre rendez-vous sera définitivement confirmé dès réception de votre acompte.</p><div className="bg-stone-100 p-4 rounded-md mb-6 text-stone-700 text-left"><p><strong>Date:</strong> {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedTime}</p><p>Vous recevrez un email de confirmation final (simulé) très prochainement.</p></div><button onClick={() => { setPage('home'); setStep(1); setSelectedService(null); }} className="bg-stone-800 text-white px-8 py-3 rounded-full hover:bg-stone-700 transition-all duration-300 shadow-lg">Retour à l'accueil</button></div>
            );
            default: return null;
        }
    };
    return <div className="container mx-auto px-6 py-12">{renderStepContent()}</div>;
};

const AdminPage = ({ setPage }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const appointmentsCollection = collection(db, `artifacts/${appId}/public/data/appointments`);
        const q = query(appointmentsCollection, orderBy("startTime", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const apptList = [];
            querySnapshot.forEach((doc) => {
                apptList.push({ id: doc.id, ...doc.data() });
            });
            setAppointments(apptList);
            setIsLoading(false);
        }, (err) => {
            console.error("Erreur lecture admin: ", err);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleConfirmAppointment = async (id) => {
        const appointmentRef = doc(db, `artifacts/${appId}/public/data/appointments`, id);
        try {
            await updateDoc(appointmentRef, {
                status: "Confirmé"
            });
        } catch (error) {
            console.error("Erreur de mise à jour: ", error);
            alert("La confirmation a échoué.");
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Confirmé': return 'bg-green-100 text-green-800';
            case 'En attente de validation': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <h2 className="text-3xl font-light text-center text-stone-800 mb-10">Panneau d'Administration</h2>
            <div className="bg-white/50 p-6 rounded-lg shadow-sm border border-stone-200/50">
                <h3 className="text-xl font-semibold text-stone-800 mb-4">Liste des Rendez-vous</h3>
                {isLoading ? <p>Chargement des rendez-vous...</p> :
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Date & Heure</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Prestation</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-stone-200">
                                {appointments.length > 0 ? appointments.map(appt => (
                                    <tr key={appt.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-800">{appt.startTime.toDate().toLocaleString('fr-CH')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                                            <div>{appt.client.name}</div>
                                            <div className="text-xs text-stone-400">{appt.client.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">{appt.serviceName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(appt.status)}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {appt.status === 'En attente de validation' && (
                                                <button onClick={() => handleConfirmAppointment(appt.id)} className="text-green-600 hover:text-green-900">Confirmer</button>
                                            )}
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="5" className="text-center py-4">Aucun rendez-vous pour le moment.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                }
            </div>
        </div>
    );
};

// --- COMPOSANT PRINCIPAL ---
export default function App() {
    const [page, setPage] = useState('home');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) { 
                setUserId(user.uid); 
            } else { 
                signInAnonymously(auth).catch(error => console.error("Auth Error", error)); 
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleAdminAccess = () => {
        if (isAdminAuthenticated) {
            setPage('admin');
            return;
        }
        const password = prompt("Veuillez entrer le mot de passe administrateur :");
        if (password === ADMIN_PASSWORD) {
            setIsAdminAuthenticated(true);
            setPage('admin');
        } else if (password) {
            alert("Mot de passe incorrect.");
        }
    };

    const renderPage = () => {
        if (!isAuthReady) { return <div className="text-center py-20">Chargement de l'application...</div>; }
        switch (page) {
            case 'prestations': return <ServicesPage />;
            case 'réserver': return <BookingPage userId={userId} setPage={setPage} />;
            case 'avis': return <ReviewsPage />;
            case 'admin': return isAdminAuthenticated ? <AdminPage setPage={setPage} /> : <HomePage setPage={setPage} />;
            case 'home': default: return <HomePage setPage={setPage} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF9F6] font-sans text-stone-700 flex flex-col">
            <Header setPage={setPage} />
            <main className="flex-grow">
                {renderPage()}
            </main>
            <footer className="text-center py-6 border-t border-stone-200/80 mt-12">
                <p className="text-sm text-stone-500">&copy; {new Date().getFullYear()} Studio Iro. Tous droits réservés.</p>
                <button onClick={handleAdminAccess} className="text-xs text-stone-400 mt-2 hover:text-stone-700 flex items-center justify-center mx-auto">
                    <LockClosedIcon /> Administration
                </button>
            </footer>
        </div>
    );
}
