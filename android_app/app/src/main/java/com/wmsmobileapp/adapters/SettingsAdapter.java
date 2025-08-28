package com.wmsmobileapp.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.wmsmobileapp.R;
import java.util.ArrayList;
import java.util.List;

public class SettingsAdapter extends RecyclerView.Adapter<SettingsAdapter.ViewHolder> {
    
    private List<String> settings = new ArrayList<>();
    
    public SettingsAdapter() {
        settings.add("Server Configuration");
        settings.add("User Profile");
        settings.add("Barcode Settings");
        settings.add("Sync Preferences");
        settings.add("About");
    }
    
    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_setting, parent, false);
        return new ViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(settings.get(position));
    }
    
    @Override
    public int getItemCount() {
        return settings.size();
    }
    
    static class ViewHolder extends RecyclerView.ViewHolder {
        private TextView settingNameText;
        
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            settingNameText = itemView.findViewById(R.id.setting_name);
        }
        
        public void bind(String settingName) {
            settingNameText.setText(settingName);
        }
    }
}