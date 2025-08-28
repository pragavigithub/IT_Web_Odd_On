package com.wmsmobileapp.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.wmsmobileapp.R;
import com.wmsmobileapp.models.PickList;
import java.util.ArrayList;
import java.util.List;

public class PickListAdapter extends RecyclerView.Adapter<PickListAdapter.ViewHolder> {
    
    private List<PickList> pickLists = new ArrayList<>();
    
    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_pick_list, parent, false);
        return new ViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(pickLists.get(position));
    }
    
    @Override
    public int getItemCount() {
        return pickLists.size();
    }
    
    static class ViewHolder extends RecyclerView.ViewHolder {
        private TextView pickListNumberText;
        private TextView statusText;
        private TextView salesOrderText;
        private TextView priorityText;
        
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            pickListNumberText = itemView.findViewById(R.id.pick_list_number);
            statusText = itemView.findViewById(R.id.status);
            salesOrderText = itemView.findViewById(R.id.sales_order);
            priorityText = itemView.findViewById(R.id.priority);
        }
        
        public void bind(PickList pickList) {
            pickListNumberText.setText(pickList.getPickListNumber());
            statusText.setText(pickList.getStatus());
            salesOrderText.setText("SO: " + pickList.getSalesOrderNumber());
            priorityText.setText(pickList.getPriority());
        }
    }
}