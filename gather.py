#!/usr/bin/env python
import os
import os.path
import shutil

in_path = "/Users/eric/Library/Application Support/Google/Chrome/Default/File System/000/p/00/"
out_path = "/Users/WebstormProjects/gl-water2d/frames/"

start_file = "00000019"

in_file_num = int(start_file)
out_frame_num = 0

while True:

    in_file_num_str = str(in_file_num).rjust(8,'0')

    in_full_path = os.path.join(in_path, in_file_num_str)

    if not os.path.isfile(in_full_path):
        break

    out_file = "frame" + str(out_frame_num).rjust(8,'0') + ".tga"
    out_full_path = os.path.join(out_path, out_file)

    print "copy ", file_num_str, " to ", out_full_path

    shutil.copyfile(in_full_path, out_full_path )

    in_file_num = in_file_num + 1
    out_frame_num = out_frame_num + 1
