import React from 'react';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();

  return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
      </div>
  );
};

export default Home;
