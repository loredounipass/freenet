import React from 'react';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="home-hero">
      <h1 className="home-title">{t('home.title')}</h1>

      <p className="home-subtitle">{t('home.subtitle')}</p>
    </div>
  );
};

export default Home;
