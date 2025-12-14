import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./Toast";
import type {
  GroomingType,
  Appointment,
  AppointmentDto,
  AxiosErrorResponse,
} from "../api";
import {
  createAppointment,
  updateAppointment,
  getGroomingTypes,
  getCustomerHistory,
} from "../api";
import { dictionary } from "../dictionary";

dayjs.extend(utc);
dayjs.extend(timezone);

interface AppointmentFormProps {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppointmentForm({
  open,
  appointment,
  onClose,
  onSuccess,
}: AppointmentFormProps) {
  const { customer } = useAuth();
  const toast = useToast();
  const [groomingTypes, setGroomingTypes] = useState<GroomingType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number>(0);
  const [appointmentDate, setAppointmentDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [discountEligible, setDiscountEligible] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const loadGroomingTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const types = await getGroomingTypes();
      setGroomingTypes(types);
      if (appointment && types.length > 0) {
        // Find type by name
        const type = types.find((t) => t.name === appointment.groomingType);
        if (type) {
          setSelectedTypeId(type.id);
        }
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as AxiosErrorResponse).response?.data?.message
          : undefined;
      toast.showToast(message || dictionary.errorLoadingGroomingTypes, "error");
    } finally {
      setLoadingTypes(false);
    }
  }, [appointment, toast]);

  const loadCustomerHistory = useCallback(async () => {
    if (!customer) return;
    try {
      const history = await getCustomerHistory(customer.id);
      setBookingCount(history.bookingCount);
      setDiscountEligible(history.bookingCount > 3);
    } catch {
      // Silently fail - discount is server-side anyway
    }
  }, [customer]);

  useEffect(() => {
    if (open) {
      loadGroomingTypes();
      if (customer) {
        loadCustomerHistory();
      }
    }
  }, [open, customer, loadGroomingTypes, loadCustomerHistory]);

  useEffect(() => {
    if (open && appointment && groomingTypes.length > 0) {
      // Edit mode - load appointment data
      // Convert UTC date to local timezone for display
      const type = groomingTypes.find(
        (t) => t.name === appointment.groomingType
      );
      if (type) {
        setSelectedTypeId(type.id);
      }
      // Parse UTC date and convert to local for the picker
      setAppointmentDate(dayjs.utc(appointment.appointmentDate).local());
    } else if (open && !appointment) {
      // Create mode
      setSelectedTypeId(0);
      setAppointmentDate(null);
    }
  }, [open, appointment, groomingTypes]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedTypeId) {
      newErrors.type = dictionary.pleaseSelectGroomingType;
    }

    if (!appointmentDate) {
      newErrors.date = dictionary.pleaseSelectDateAndTime;
    } else {
      // Validate in UTC - convert local time to UTC for comparison
      const appointmentDateUTC = appointmentDate.utc();
      const nowUTC = dayjs.utc();
      if (appointmentDateUTC.isBefore(nowUTC) || appointmentDateUTC.isSame(nowUTC)) {
        newErrors.date = dictionary.appointmentDateMustBeInFuture;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Convert local datetime to UTC ISO string before sending
      const appointmentDto: AppointmentDto = {
        groomingTypeId: selectedTypeId,
        appointmentDate: appointmentDate!.utc().toISOString(),
      };

      if (appointment) {
        // Update
        await updateAppointment(appointment.id, appointmentDto);
        toast.showToast(dictionary.appointmentUpdatedSuccessfully, "success");
      } else {
        // Create
        await createAppointment(appointmentDto);
        toast.showToast(dictionary.appointmentCreatedSuccessfully, "success");
      }

      onSuccess();
      handleClose();
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as AxiosErrorResponse).response?.data?.message
          : undefined;
      toast.showToast(message || dictionary.errorSavingAppointment, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTypeId(0);
    setAppointmentDate(null);
    setErrors({});
    onClose();
  };

  const selectedType = groomingTypes.find((t) => t.id === selectedTypeId);
  const calculatedPrice = selectedType
    ? discountEligible
      ? selectedType.price * 0.9
      : selectedType.price
    : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {appointment ? dictionary.editAppointment : dictionary.newAppointmentForm}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          {loadingTypes ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TextField
                select
                label={dictionary.groomingType}
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(Number(e.target.value))}
                fullWidth
                error={!!errors.type}
                helperText={
                  errors.type ||
                  (selectedType &&
                    `${dictionary.priceLabel}: ₪${selectedType.price.toFixed(2)}, ${dictionary.durationLabel}: ${
                      selectedType.durationMinutes
                    } ${dictionary.minutes}`)
                }
                required
              >
                {groomingTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name} - ₪{type.price.toFixed(2)} (
                    {type.durationMinutes} {dictionary.minutes})
                  </MenuItem>
                ))}
              </TextField>

              {selectedType && discountEligible && (
                <Alert severity="info">
                  {dictionary.youHavePreviousAppointments} {bookingCount} {dictionary.previousAppointments} - {dictionary.eligibleForDiscount}
                  {dictionary.discountPercent} {dictionary.discountedPrice}: ₪{calculatedPrice.toFixed(2)}
                </Alert>
              )}

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label={dictionary.dateAndTimeLabel}
                  value={appointmentDate}
                  onChange={(newValue) => setAppointmentDate(newValue)}
                  minDateTime={dayjs().add(1, "minute")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date,
                      helperText: errors.date,
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>

              {selectedType && (
                <Box
                  sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    {dictionary.summary}
                  </Typography>
                  <Typography variant="body2">
                    {dictionary.type}: {selectedType.name}
                  </Typography>
                  <Typography variant="body2">
                    {dictionary.durationLabel}: {selectedType.durationMinutes} {dictionary.minutes}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {dictionary.estimatedPrice}: ₪{calculatedPrice.toFixed(2)}
                    {discountEligible && ` (${dictionary.includingDiscount})`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dictionary.finalPriceCalculatedByServer}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {dictionary.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedTypeId || !appointmentDate}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : appointment ? (
            dictionary.update
          ) : (
            dictionary.createAppointment
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
