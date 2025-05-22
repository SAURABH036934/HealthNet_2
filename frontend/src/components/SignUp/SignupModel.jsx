import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Fade,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import styles from './SignupModel.module.css';
import { useAuth } from '../../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { departments } from '../Dashboard/Doctor/doctorDepartments';
import { departmentSpecialities } from '../Dashboard/Doctor/departmentSpecialities';
import api from '../../api'; // Add this import

const userRoles = ["Patient", "Staff", "Doctor", "Admin"];
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

export default function SignupModal({ onClose }) {
  const { setLoader, setAlert, setAlertMsg, setAlertType } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user: "Patient",
    department: "",
    speciality: "",
    fname: "",
    lname: "",
    email: "",
    password: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field) => (event) => {
    if (field === 'department') {
      setFormData(prev => ({
        ...prev,
        department: event.target.value,
        speciality: '' // Reset speciality when department changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: event.target.value
      }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fname.trim()) newErrors.fname = "First name is required";
    if (!formData.lname.trim()) newErrors.lname = "Last name is required";
    if (!EMAIL_REGEX.test(formData.email)) newErrors.email = "Enter a valid email";
    if (!PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters with uppercase, lowercase and number";
    }
    
    if (formData.user === "Doctor") {
      if (!formData.department) newErrors.department = "Department is required";
      if (!formData.speciality) newErrors.speciality = "Speciality is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setLoader(true);

      const postData = {
        userType: formData.user,
        fname: formData.fname.trim(),
        lname: formData.lname.trim(),
        ...(formData.user === "Doctor" && {
          department: formData.department,
          speciality: formData.speciality
        }),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const response = await api.signup(postData);

      if (response.data.error) {
        setLoader(false);
        setAlertMsg(response.data.errorMsg);
        setAlertType("error");
        setAlert(true);
      } else {
        setLoader(false);
        setAlertMsg(response.data.msg || "Signup Successful!");
        setAlertType("success");
        setAlert(true);
        onClose();
        setTimeout(() => {
          navigate("/signin");
        }, 1500);
      }
    } catch (error) {
      setLoader(false);
      if (error.response?.status === 409) {
        setAlertMsg("This email is already registered");
      } else {
        setAlertMsg(error.response?.data?.errorMsg || "An error occurred during signup!");
      }
      setAlertType("error");
      setAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Fade in={true} timeout={300}>
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <IconButton 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          
          <Box component="form" className={styles.form} onSubmit={handleSubmit}>
            <Box className={styles.formHeader}>
              <Avatar className={styles.avatar}>
                <FavoriteIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                Sign Up
              </Typography>
            </Box>

            <FormControl fullWidth className={styles.formField}>
              <InputLabel>User Type</InputLabel>
              <Select
                value={formData.user}
                onChange={handleInputChange('user')}
                label="User Type"
              >
                {userRoles.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.user === "Doctor" && (
              <>
                <FormControl fullWidth className={styles.formField} error={!!errors.department}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    onChange={handleInputChange('department')}
                    label="Department"
                  >
                    {departments
                      .filter(dept => dept !== "All Departments")
                      .map((dept) => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                  </Select>
                  {errors.department && (
                    <Typography color="error" variant="caption">{errors.department}</Typography>
                  )}
                </FormControl>

                <FormControl 
                  fullWidth 
                  className={styles.formField} 
                  error={!!errors.speciality}
                  disabled={!formData.department}
                >
                  <InputLabel>Speciality</InputLabel>
                  <Select
                    value={formData.speciality}
                    onChange={handleInputChange('speciality')}
                    label="Speciality"
                  >
                    {formData.department && departmentSpecialities[formData.department]?.map((spec) => (
                      <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                    ))}
                  </Select>
                  {errors.speciality && (
                    <Typography color="error" variant="caption">{errors.speciality}</Typography>
                  )}
                </FormControl>
              </>
            )}

            <Box className={styles.nameContainer}>
              <TextField
                className={styles.nameInput}
                required
                label="First Name"
                value={formData.fname}
                onChange={handleInputChange('fname')}
                error={!!errors.fname}
                helperText={errors.fname}
              />
              <TextField
                className={styles.nameInput}
                required
                label="Last Name"
                value={formData.lname}
                onChange={handleInputChange('lname')}
                error={!!errors.lname}
                helperText={errors.lname}
              />
            </Box>

            <TextField
              required
              fullWidth
              className={styles.formField}
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!errors.email}
              helperText={errors.email}
            />

            <TextField
              required
              fullWidth
              className={styles.formField}
              type="password"
              label="Password"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!errors.password}
              helperText={errors.password}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                "Sign Up"
              )}
            </Button>

            <Link 
              to="/signin" 
              className={styles.linkBtn}
              onClick={onClose}
            >
              Already have an account? Sign In
            </Link>
          </Box>
        </div>
      </div>
    </Fade>
  );
}