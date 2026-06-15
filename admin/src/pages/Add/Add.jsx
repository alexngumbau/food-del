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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
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
  
  const imagePreview = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    if ( name === 'description' && value.length > MAX_DESC_CHARS ) return;
    setData((prev) => ({ ...prev, [name]: value }));
  }

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be 5MB or smaller');
      return;
    }
    setImage(file)
  }

  const goBack = () => setCurrentStep((s) => Math.max(1, s-1));
  const goNext = () => setCurrentStep((s) => Math.min(4, s+1));

  const canContinue = () => {
    if (currentStep === 1) return !!image;
    if (currentStep === 2) return data.name.trim() && data.description.trim();
    if (currentStep === 3) return data.category && Number(data.price) > 0;
    return true;
  }

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('category', data.category);
      formData.append('image', image);

      const res = await axios.post(`${url}/api/food/add`, formData, {headers: {token}});
      if (res.data.success) {
        toast.success(res.data.message);

        // Reset
        setData({name: '', description: '', price: '', category: 'Salad', availability: 'available' })
        setImage(null);
        setCurrentStep(1);
        navigate('/list');
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.log(err);
      
      toast.error('Failed to publish item.');
    } finally {
      setSubmitting(false);
    }
  }

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

      {/* Body */}
      <div className="body-card">
        {currentStep === 1 && (
          <Step1Image 
            image={image}
            imagePreview={imagePreview}
            dragging={dragging}
            setDragging={setDragging}
            onDrop={onDrop}
            onFile={handleFile}
            onClear={() => setImage(null)}
          />
        )}

        {currentStep === 2 && (
          <Step2Details
            data={data}
            image={image}
            imagePreview={imagePreview}
            onChange={onChangeHandler}
            onReplace={(f) => handleFile(f)}
            onRemove={() => setImage(null)}
          />
        )}

        {/* Footer */}
        <div className="step-footer">
          <div className="step-progress">Step {currentStep} of {STEPS.length}</div>
          <div className="step-actions">
            <button className="btn-ghost" onClick={goBack} disabled={currentStep === 1}>
              ← Back
            </button>
            {currentStep < 4 ? (
              <button className="btn-primary" onClick={goNext} disabled={!canContinue()}> 
                Continue →
              </button>
            ) : (
              <button className="btn-publish" onClick={onSubmit} disabled={submitting}>
                {submitting ? 'Publishing...' : '✓ Publish Item'}
              </button>
            )}
          </div>
        </div>


      </div>

      
      


    </div>

  );
};

// Step 1: Image
const Step1Image = ({image, imagePreview, dragging, setDragging, onDrop, onFile, onClear}) => (
  <>
    <div className="title">Upload product image</div>
    <div className="subtitle">A bright, square photo of the dish helps customers decide faster.</div>

    <label 
      htmlFor="image"
      className={`hero-drop ${dragging ? 'dragging' : ''} ${image ? 'has-image' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {image ? (
        <img className="preview-image" src={imagePreview} alt="preview" />
      ) : (
        <>
          <div className="hero-icon">↑</div>
          <h2>Drag and drop your photo here</h2>
          <p>Or browse files from your computer. A clean background and natural light work best.</p>
         
        </>
      )}
    </label>
    <input 
      id="image"
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => onFile(e.target.files?.[0])}
    />

    {image && (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button className="link-btn muted" type="button" onClick={onClear}>Remove image</button>
      </div>
    )}

    <div className="meta-row">
      <span><span className="dot"></span> PNG, JPG, WEBP</span>
      <span><span className="dot"></span> Max 5MB</span>
      <span><span className="dot"></span> Recommended 800x800</span>
    </div>
  </>
)

// Step 2: Details
const Step2Details = ({ data, image, imagePreview, onChange, onReplace, onRemove }) => (
  <>
    <div className="title">Tell us about the dish</div>
    <div className="subtitle">A clear name and appetizing description help your item stand out.</div>

    {image && (
      <div className="uploaded-strip">
        <img src={imagePreview} className="thumb" />
        <div className="info">
          <strong>{image.name}</strong>
          <span>{formatBytes(image.size)}</span>
        </div>
        <div className="actions">
          <label htmlFor="image-replace" className="link-btn" style={{ cursor: 'pointer' }}>Replace</label>
          <input
            id="image-replace"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onReplace(e.target.files?.[0])}
          />
          <button className="link-btn muted" onClick={onRemove}>Remove</button>
        </div>
      </div>
    )}

    <div className="form-grid">
      <div className="form-row">
        <label>Product Name</label>
        <input
          type="text"
          name="name"
          value={data.name}
          onChange={onChange}
          placeholder="e.g. Margherita Pizza"
        />
        <span className="hint">Keep it short and recognizable.</span>
      </div>
      <div className="form-row">
        <label>Product description</label>
        <textarea
          name="description"
          value={data.description}
          onChange={onChange}
          placeholder="Write a short, appetizing description..."
        />
        <div className="char-count">{data.description.length} / {MAX_DESC_CHARS}</div>
      </div>
    </div>

  </>
)