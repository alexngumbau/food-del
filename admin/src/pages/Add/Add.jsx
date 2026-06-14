import { useState, useContext, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './Add.css';

const STEPS = [
  { id: 1, label: 'Image' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Category & Price' },
  { id: 4, label: 'Review' },
]

const CATEGORIES = [
  { name: 'Salad',    emoji: '🥗' },
  { name: 'Rolls',    emoji: '🌯' },
  { name: 'Deserts',  emoji: '🍰' },
  { name: 'Sandwich', emoji: '🥪' },
  { name: 'Cake',     emoji: '🎂' },
  { name: 'Pure Veg', emoji: '🥬' },
  { name: 'Pasta',    emoji: '🍝' },
  { name: 'Noodles',  emoji: '🍜' },
];

const MAC_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DESC_CHARS = 240;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const Add = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [image, setImage] = useState(null);
  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    availability: 'available',
  });

  const fillPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="add">
      {/* Header */}
      <div className="add-header">
        <div>
          <h1>Add Menu Item</h1>
          <p>Follow the steps to publish a new dish</p>
        </div>
        <button className="btn-ghost" onClick={() => navigate('/list')} >Cancel</button>
      </div>

      {/* Stepper */}
      <div className="stepper-card">
        <div className="stepper">
          <div className="step-line">
            <div className="fill" style={{ width: `${fillPercent}%` }} />
          </div>
          {STEPS.map((s) => {
            const status = currentStep === s.id ? 'active' : currentStep > s.id ? 'done' : '';
            return (
              <div key={s.id} className={`step ${status}`}>
                <div className="dot">{currentStep > s.id ? '✓' : s.id }</div>
                <div className="label">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>


    </div>

  )
}
